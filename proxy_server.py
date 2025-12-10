#!/usr/bin/env python3
"""
Simple proxy server for football-data.org API
Run this separately to proxy API calls and avoid CORS issues
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import requests
import json

class ProxyHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/api/football/'):
            # Extract the actual API path
            api_path = self.path.replace('/api/football/', '')
            api_url = f'https://api.football-data.org/v4/{api_path}'
            
            try:
                # Add API key header
                headers = {
                    'X-Auth-Token': '6afd2c090a1a4454942d3570d86220e7'
                }
                
                # Make the request to football-data.org
                response = requests.get(api_url, headers=headers)
                response.raise_for_status()
                
                # Send response back to client
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                self.wfile.write(response.content)
                
            except requests.exceptions.RequestException as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                error_response = {
                    'error': 'Failed to fetch from football-data.org',
                    'message': str(e)
                }
                self.wfile.write(json.dumps(error_response).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_OPTIONS(self):
        # Handle preflight requests
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == '__main__':
    server_address = ('', 3002)
    httpd = HTTPServer(server_address, ProxyHandler)
    print("Proxy server running on http://localhost:3002")
    print("Access football-data.org API via: http://localhost:3002/api/football/...")
    httpd.serve_forever()
