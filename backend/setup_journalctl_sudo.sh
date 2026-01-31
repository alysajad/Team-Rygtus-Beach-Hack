#!/bin/bash

# This script configures sudo permissions for journalctl
# so the backend can fetch logs without password prompt

echo "Configuring sudo permissions for journalctl..."

# Create sudoers file for journalctl
sudo tee /etc/sudoers.d/journalctl-nopasswd > /dev/null << 'EOF'
# Allow the current user to run journalctl without password
%sudo ALL=(ALL) NOPASSWD: /usr/bin/journalctl
EOF

# Set proper permissions
sudo chmod 0440 /etc/sudoers.d/journalctl-nopasswd

echo "✅ Sudo configuration complete!"
echo "The backend can now run 'sudo journalctl' without password prompt."
