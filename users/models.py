from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    first_name = models.CharField(max_length=30, blank=True)
    last_name = models.CharField(max_length=30, blank=True)
    is_paid = models.BooleanField(default=False, help_text="Whether user has paid and can access the system")
    total_points = models.IntegerField(default=0, help_text="Total points earned from predictions")
    phone = models.CharField(max_length=20, blank=True, null=True, help_text="User's phone number")
    notified = models.BooleanField(default=False, help_text="Whether admin has been notified about this user")
    
    class Meta:
        db_table = 'auth_user'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        constraints = [
            models.UniqueConstraint(fields=['email'], name='unique_email'),
            models.UniqueConstraint(fields=['phone'], name='unique_phone', condition=models.Q(phone__isnull=False) & ~models.Q(phone=''))
        ]
    
    def __str__(self):
        return f"{self.username} ({'Paid' if self.is_paid else 'Unpaid'})"


class PaymentLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payment_logs')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    proof = models.CharField(max_length=255, blank=True, null=True)
    admin_verified = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, help_text="Admin notes about this payment")
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Payment Log'
        verbose_name_plural = 'Payment Logs'
    
    def __str__(self):
        return f"{self.user.username} - ${self.amount} - {'Verified' if self.admin_verified else 'Pending'}"
