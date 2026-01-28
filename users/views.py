from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import login
from django.core.mail import send_mail
from django.conf import settings
from .serializers import UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer, PaymentLogSerializer
from .models import User, PaymentLog


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        
        # Send admin account details via email
        if user.email:
            try:
                send_mail(
                    subject="🎯 Welcome to Match Prediction - Payment Required",
                    message=(
                        f"Dear {user.get_full_name() or user.username},\n\n"
                        f"🎉 Welcome to the Match Prediction System!\n\n"
                        f"📝 Your registration was successful. To activate your account, please make a payment to the following admin account:\n\n"
                        f"💳 **Payment Details:**\n"
                        f"• Account Number: {settings.ADMIN_ACCOUNT_NUMBER}\n"
                        f"• Account Name: {settings.ADMIN_ACCOUNT_NAME}\n"
                        f"• Bank: {settings.ADMIN_BANK_NAME}\n\n"
                        f"📋 Next Steps:\n"
                        f"1. Make the payment to the account above\n"
                        f"2. Submit your payment proof through the app\n"
                        f"3. Wait for admin verification\n"
                        f"4. You'll receive a confirmation email once your account is activated\n\n"
                        f"⚠️ Important: Your account will remain inactive until payment is verified by the admin.\n\n"
                        f"If you have any questions, feel free to contact us.\n\n"
                        f"Good luck with your predictions!\n"
                        f"Kindly note that this is an automated message. Please do not reply to this email."
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
                print(f"Registration email with payment details sent to {user.email}")
            except Exception as e:
                print(f"Failed to send registration email to {user.email}: {e}")
        
        return Response({
            'user': UserProfileSerializer(user).data,
            'token': token.key,
            'message': 'Registration successful. Please check your email for payment details and wait for admin payment confirmation before logging in.'
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        login(request, user)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'user': UserProfileSerializer(user).data,
            'token': token.key,
            'message': 'Login successful'
        }, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout(request):
    try:
        request.user.auth_token.delete()
        return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)
    except Token.DoesNotExist:
        return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)


@api_view(['GET', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def profile(request):
    if request.method == 'GET':
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)
    
    elif request.method == 'PATCH':
        user = request.user
        data = request.data
        
        # Update username if provided
        if 'username' in data:
            if User.objects.filter(username=data['username']).exclude(id=user.id).exists():
                return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
            user.username = data['username']
        
        # Update phone if provided
        if 'phone' in data:
            phone = data['phone']
            if phone and User.objects.filter(phone=phone).exclude(id=user.id).exists():
                return Response({'error': 'Phone number already exists'}, status=status.HTTP_400_BAD_REQUEST)
            user.phone = phone
        
        user.save()
        return Response({
            'message': 'Profile updated successfully',
            'user': UserProfileSerializer(user).data
        })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def submit_payment(request):
    serializer = PaymentLogSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response({
            'message': 'Payment proof submitted successfully. Awaiting admin verification.',
            'payment': serializer.data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def payment_history(request):
    payments = PaymentLog.objects.filter(user=request.user).order_by('-timestamp')
    serializer = PaymentLogSerializer(payments, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def new_users_notifications(request):
    """Get new user registrations for admin notifications"""
    if not request.user.is_staff:
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    # Get users who haven't been notified yet
    new_users = User.objects.filter(notified=False).order_by('-date_joined')
    
    # Format response for frontend
    users_data = []
    for user in new_users:
        users_data.append({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'phone': user.phone,
            'created_at': user.date_joined.isoformat(),
            'notified': user.notified
        })
    
    return Response(users_data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_paid(request):
    """Mark all unpaid users as paid and notify them via email (admin only)"""

    if not request.user.is_staff:
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )

    unpaid_users = User.objects.filter(is_paid=False)

    updated_count = 0

    for user in unpaid_users:
        user.is_paid = True
        user.notified = True
        user.save()

        # Send email notification
        if user.email:
            try:
                send_mail(
                    subject="✅ Your Match Prediction Account is Now Active!",
                    message=(
                        f"Dear {user.get_full_name() or user.username},\n\n"
                        "🎉 Great news! Your payment has been successfully verified.\n\n"
                        "📱 Your account is now active and you can:\n"
                        "• Log in to the system\n"
                        "• Browse upcoming matches\n"
                        "• Make predictions\n"
                        "• Compete on the leaderboard\n"
                        "• Use your 2-Star power-ups\n\n"
                        "If you have any questions, feel free to contact us.\n\n"
                        "Good luck with your predictions!\n"
                        "Kindly note that this is an automated message. Please do not reply to this email, la."

                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
                print(f"Email sent successfully to {user.email}")
            except Exception as e:
                print(f"Failed to send email to {user.email}: {e}")

        updated_count += 1

    return Response(
        {
            'message': f'Successfully marked {updated_count} users as paid and notified',
            'count': updated_count
        },
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    """Change user password"""
    user = request.user
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')
    
    if not current_password or not new_password:
        return Response({'error': 'Current password and new password are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if current password is correct
    if not user.check_password(current_password):
        return Response({'error': 'Current password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate new password
    if len(new_password) < 6:
        return Response({'error': 'Password must be at least 6 characters long'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Change password
    user.set_password(new_password)
    user.save()
    
    return Response({'message': 'Password changed successfully'})


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def forgot_password(request):
    """Send password reset email to user"""
    email = request.data.get('email')
    
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
        
        # Generate a simple reset token (you might want to use Django's built-in password reset in production)
        reset_token = Token.objects.get_or_create(user=user)[0].key
        
        # Create reset link (in production, you'd want a proper reset page)
        reset_link = f"http://localhost:3000/reset-password?token={reset_token}"
        
        # Send email
        subject = 'Password Reset Request - Match Prediction System'
        message = f"""Hello {user.first_name} {user.last_name},

You requested a password reset for your Match Prediction account.

Click the link below to reset your password:
{reset_link}

This link will expire in 24 hours.

If you didn't request this password reset, please ignore this email.

Thanks,
Match Prediction Team
"""
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
        
        print(f"Password reset email sent to {email}")
        return Response({
            'message': 'Password reset link has been sent to your email address.'
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        # Email not found in database
        return Response({
            'error': 'No account found with this email address.'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"Failed to send password reset email to {email}: {e}")
        return Response({
            'error': 'Failed to send reset email. Please try again later.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def reset_password(request):
    """Reset password using token"""
    token = request.data.get('token')
    password = request.data.get('password')
    
    if not token or not password:
        return Response({'error': 'Token and password are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Find token
        token_obj = Token.objects.get(key=token)
        user = token_obj.user
        
        # Validate password
        if len(password) < 6:
            return Response({'error': 'Password must be at least 6 characters long'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Set new password
        user.set_password(password)
        user.save()
        
        # Delete the token after use
        token_obj.delete()
        
        return Response({
            'message': 'Password reset successfully',
            'username': user.username
        }, status=status.HTTP_200_OK)
        
    except Token.DoesNotExist:
        return Response({'error': 'Invalid or expired reset token'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception:
        return Response({'error': 'Failed to reset password. Please try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
