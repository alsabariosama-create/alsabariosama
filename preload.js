const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Window control functions - Fixed and improved
  minimizeWindow: async () => {
    try {
      const result = await ipcRenderer.invoke('window-minimize');
      return result;
    } catch (error) {
      console.error('Error minimizing window:', error);
      return { success: false, error: error.message };
    }
  },

  toggleMaximizeWindow: async () => {
    try {
      const result = await ipcRenderer.invoke('window-toggle-maximize');
      return result;
    } catch (error) {
      console.error('Error toggling maximize window:', error);
      return { success: false, error: error.message };
    }
  },

  closeWindow: async () => {
    try {
      const result = await ipcRenderer.invoke('window-close');
      return result;
    } catch (error) {
      console.error('Error closing window:', error);
      return { success: false, error: error.message };
    }
  },

  getWindowState: async () => {
    try {
      const result = await ipcRenderer.invoke('get-window-state');
      return result;
    } catch (error) {
      console.error('Error getting window state:', error);
      return null;
    }
  },

  // Data management functions - Enhanced
  saveAppData: async (data) => {
    try {
      const result = await ipcRenderer.invoke('save-app-data', data);
      return result;
    } catch (error) {
      console.error('Error saving app data:', error);
      return { success: false, error: error.message };
    }
  },

  loadAppData: async () => {
    try {
      const result = await ipcRenderer.invoke('load-app-data');
      return result;
    } catch (error) {
      console.error('Error loading app data:', error);
      return { success: false, error: error.message };
    }
  },

  exportData: async (data) => {
    try {
      const result = await ipcRenderer.invoke('export-data', data);
      return result;
    } catch (error) {
      console.error('Error exporting data:', error);
      return { success: false, error: error.message };
    }
  },

  importData: async () => {
    try {
      const result = await ipcRenderer.invoke('import-data');
      return result;
    } catch (error) {
      console.error('Error importing data:', error);
      return { success: false, error: error.message };
    }
  },

  // Print functionality
  printView: async () => {
    try {
      const result = await ipcRenderer.invoke('print-view');
      return result;
    } catch (error) {
      console.error('Error printing:', error);
      return { success: false, error: error.message };
    }
  },

  // File system operations
  saveFile: async (filePath, data) => {
    try {
      const fs = require('fs').promises;
      await fs.writeFile(filePath, data, 'utf8');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  loadFile: async (filePath) => {
    try {
      const fs = require('fs').promises;
      const data = await fs.readFile(filePath, 'utf8');
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // IPC communication with main process
  on: (channel, callback) => {
    const validChannels = [
      'new-case', 'save-data', 'create-backup', 'restore-backup', 
      'window-maximized', 'window-unmaximized', 'export-all-data', 
      'import-all-data', 'generate-comprehensive-report', 
      'show-detailed-statistics', 'search', 'show-user-guide',
      'save-before-close'
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, callback);
    }
  },

  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // Utility functions
  formatDate: (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('ar-SA');
  },

  formatNumber: (num) => {
    if (typeof num !== 'number') return '';
    return num.toLocaleString('ar-EG');
  },

  formatCurrency: (amount) => {
    if (typeof amount !== 'number') return '';
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'IQD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  },

  // Validation helpers
  validateEmail: (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  validatePhone: (phone) => {
    const re = /^[\+]?[1-9][\d]{0,15}$/;
    return re.test(phone.replace(/\s+/g, ''));
  },

  validateIraqiPhone: (phone) => {
    const re = /^(\+964|964|0)?(7[0-9]{9}|1[0-9]{8})$/;
    return re.test(phone.replace(/\s+/g, ''));
  },

  // System information
  getAppVersion: () => {
    return '1.1.0';
  },

  getPlatform: () => {
    return process.platform;
  },

  getSystemInfo: () => {
    const os = require('os');
    return {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpus: os.cpus().length,
      hostname: os.hostname(),
      username: os.userInfo().username
    };
  },

  // Enhanced data persistence
  saveDataToUserDirectory: async (filename, data) => {
    try {
      const os = require('os');
      const path = require('path');
      const fs = require('fs').promises;
      
      const userDir = path.join(os.homedir(), 'LegalCasesManagement');
      
      // Ensure directory exists
      try {
        await fs.access(userDir);
      } catch {
        await fs.mkdir(userDir, { recursive: true });
      }
      
      const filePath = path.join(userDir, filename);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
      
      return { success: true, path: filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  loadDataFromUserDirectory: async (filename) => {
    try {
      const os = require('os');
      const path = require('path');
      const fs = require('fs').promises;
      
      const userDir = path.join(os.homedir(), 'LegalCasesManagement');
      const filePath = path.join(userDir, filename);
      
      const data = await fs.readFile(filePath, 'utf8');
      return { success: true, data: JSON.parse(data) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Backup and restore functionality
  createBackup: async (data) => {
    try {
      const os = require('os');
      const path = require('path');
      const fs = require('fs').promises;
      
      const backupDir = path.join(os.homedir(), 'LegalCasesManagement', 'Backups');
      
      // Ensure backup directory exists
      try {
        await fs.access(backupDir);
      } catch {
        await fs.mkdir(backupDir, { recursive: true });
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFilename = `backup-${timestamp}.json`;
      const backupPath = path.join(backupDir, backupFilename);
      
      const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.1.0',
        data: data
      };
      
      await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2), 'utf8');
      
      return { success: true, path: backupPath, filename: backupFilename };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  listBackups: async () => {
    try {
      const os = require('os');
      const path = require('path');
      const fs = require('fs').promises;
      
      const backupDir = path.join(os.homedir(), 'LegalCasesManagement', 'Backups');
      
      try {
        const files = await fs.readdir(backupDir);
        const backupFiles = files
          .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
          .map(file => {
            const filePath = path.join(backupDir, file);
            return {
              filename: file,
              path: filePath,
              timestamp: file.replace('backup-', '').replace('.json', '')
            };
          })
          .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        
        return { success: true, backups: backupFiles };
      } catch {
        return { success: true, backups: [] };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // PDF and document generation
  generatePDF: async (htmlContent, filename) => {
    try {
      // This would require additional setup for PDF generation
      // For now, we'll use the browser's print functionality
      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
      
      return { success: true, message: 'تم فتح نافذة الطباعة' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Network and connectivity
  checkInternetConnection: async () => {
    try {
      const response = await fetch('https://www.google.com', { 
        method: 'HEAD',
        mode: 'no-cors',
        timeout: 5000
      });
      return { connected: true };
    } catch {
      return { connected: false };
    }
  },

  // Security and encryption helpers
  hashPassword: async (password) => {
    try {
      const crypto = require('crypto');
      const hash = crypto.createHash('sha256');
      hash.update(password);
      return { success: true, hash: hash.digest('hex') };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Log management
  writeLog: async (level, message, data = null) => {
    try {
      const os = require('os');
      const path = require('path');
      const fs = require('fs').promises;
      
      const logDir = path.join(os.homedir(), 'LegalCasesManagement', 'Logs');
      
      // Ensure log directory exists
      try {
        await fs.access(logDir);
      } catch {
        await fs.mkdir(logDir, { recursive: true });
      }
      
      const today = new Date().toISOString().split('T')[0];
      const logFile = path.join(logDir, `app-${today}.log`);
      
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: level.toUpperCase(),
        message,
        data
      };
      
      const logLine = JSON.stringify(logEntry) + '\n';
      
      await fs.appendFile(logFile, logLine, 'utf8');
      
      return { success: true };
    } catch (error) {
      console.error('Error writing log:', error);
      return { success: false, error: error.message };
    }
  },

  // Automatic backup scheduling
  scheduleAutoBackup: (intervalMinutes = 30) => {
    if (window.autoBackupInterval) {
      clearInterval(window.autoBackupInterval);
    }
    
    window.autoBackupInterval = setInterval(() => {
      const event = new CustomEvent('autoBackupRequested');
      document.dispatchEvent(event);
    }, intervalMinutes * 60 * 1000);
    
    return { success: true, interval: intervalMinutes };
  },

  clearAutoBackup: () => {
    if (window.autoBackupInterval) {
      clearInterval(window.autoBackupInterval);
      window.autoBackupInterval = null;
      return { success: true };
    }
    return { success: false, reason: 'No auto backup scheduled' };
  }
});

// Enhanced error handling
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  window.electronAPI.writeLog('error', 'Global JavaScript error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error ? event.error.stack : null
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  window.electronAPI.writeLog('error', 'Unhandled promise rejection', {
    reason: event.reason
  });
});

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('Legal Cases Management System - Electron App Loaded');
  
  // Set up window state monitoring
  window.electronAPI.getWindowState().then(state => {
    if (state) {
      const maximizeIcon = document.getElementById('maximize-icon');
      if (maximizeIcon) {
        maximizeIcon.className = state.isMaximized ? 'fas fa-window-restore' : 'fas fa-window-maximize';
      }
    }
  });
  
  // Trigger data load event
  const event = new CustomEvent('electronReady');
  document.dispatchEvent(event);
});

// Handle IPC events from main process
ipcRenderer.on('new-case', () => {
  const event = new CustomEvent('newCase');
  document.dispatchEvent(event);
});

ipcRenderer.on('save-data', () => {
  const event = new CustomEvent('saveData');
  document.dispatchEvent(event);
});

ipcRenderer.on('create-backup', (event, filePath) => {
  const customEvent = new CustomEvent('createBackup', { detail: { filePath } });
  document.dispatchEvent(customEvent);
});

ipcRenderer.on('restore-backup', (event, filePath) => {
  const customEvent = new CustomEvent('restoreBackup', { detail: { filePath } });
  document.dispatchEvent(customEvent);
});

ipcRenderer.on('export-all-data', (event, filePath) => {
  const customEvent = new CustomEvent('exportAllData', { detail: { filePath } });
  document.dispatchEvent(customEvent);
});

ipcRenderer.on('import-all-data', (event, filePath) => {
  const customEvent = new CustomEvent('importAllData', { detail: { filePath } });
  document.dispatchEvent(customEvent);
});

ipcRenderer.on('generate-comprehensive-report', () => {
  const event = new CustomEvent('generateComprehensiveReport');
  document.dispatchEvent(event);
});

ipcRenderer.on('show-detailed-statistics', () => {
  const event = new CustomEvent('showDetailedStatistics');
  document.dispatchEvent(event);
});

ipcRenderer.on('search', () => {
  const event = new CustomEvent('globalSearch');
  document.dispatchEvent(event);
});

ipcRenderer.on('show-user-guide', () => {
  const event = new CustomEvent('showUserGuide');
  document.dispatchEvent(event);
});

ipcRenderer.on('save-before-close', () => {
  const event = new CustomEvent('saveBeforeClose');
  document.dispatchEvent(event);
});

// Handle window maximize/unmaximize events
ipcRenderer.on('window-maximized', () => {
  const maximizeIcon = document.getElementById('maximize-icon');
  if (maximizeIcon) {
    maximizeIcon.className = 'fas fa-window-restore';
  }
  const event = new CustomEvent('windowMaximized');
  document.dispatchEvent(event);
});

ipcRenderer.on('window-unmaximized', () => {
  const maximizeIcon = document.getElementById('maximize-icon');
  if (maximizeIcon) {
    maximizeIcon.className = 'fas fa-window-maximize';
  }
  const event = new CustomEvent('windowUnmaximized');
  document.dispatchEvent(event);
});