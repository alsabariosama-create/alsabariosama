const { app, BrowserWindow, Menu, dialog, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Keep a global reference of the window object
let mainWindow;

function getIconPath() {
  // في حالة التطوير
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    // استخدام المسار المباشر للأيقونة في مجلد المشروع
    const devIconPath = path.join(__dirname, 'assets', 'icon.png');
    if (fs.existsSync(devIconPath)) {
      console.log(`Using development icon: ${devIconPath}`);
      return devIconPath;
    }
  }
  
  // في حالة التطبيق المبني
  // محاولة العثور على الأيقونة في مواقع مختلفة
  const possiblePaths = [
    path.join(process.resourcesPath, 'assets', 'icon.png'),
    path.join(process.resourcesPath, 'app', 'assets', 'icon.png'),
    path.join(__dirname, 'assets', 'icon.png'),
    path.join(path.dirname(process.execPath), 'assets', 'icon.png')
  ];
  
  for (const iconPath of possiblePaths) {
    if (fs.existsSync(iconPath)) {
      console.log(`Using production icon: ${iconPath}`);
      return iconPath;
    }
  }
  
  console.warn('Icon file not found in any expected location');
  return null;
}

function createWindow() {
  const iconPath = getIconPath();
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    frame: false, // Remove default window frame for custom controls
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    resizable: true,
    maximizable: true,
    minimizable: true,
    closable: true,
    icon: iconPath, // استخدام الأيقونة المحددة
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false
    },
    show: false // Don't show until ready
  });

  // Load the app
  mainWindow.loadFile('index.html');

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Focus on window
    if (process.platform === 'darwin') {
      app.dock.show();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle window maximize/unmaximize events to update the UI
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-maximized');
    // Update maximize button icon
    mainWindow.webContents.executeJavaScript(`
      const maximizeIcon = document.getElementById('maximize-icon');
      if (maximizeIcon) {
        maximizeIcon.className = 'fas fa-window-restore';
      }
    `);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-unmaximized');
    // Update maximize button icon
    mainWindow.webContents.executeJavaScript(`
      const maximizeIcon = document.getElementById('maximize-icon');
      if (maximizeIcon) {
        maximizeIcon.className = 'fas fa-window-maximize';
      }
    `);
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Prevent navigation to external sites
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== 'file://') {
      event.preventDefault();
    }
  });

  // Create application menu
  createApplicationMenu();

  // Setup window control handlers
  setupWindowControlHandlers();

  // Setup IPC handlers for all application functions
  setupApplicationHandlers();
}

function createApplicationMenu() {
  const template = [
    {
      label: 'ملف',
      submenu: [
        {
          label: 'دعوى جديدة',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('new-case');
          }
        },
        {
          label: 'حفظ',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('save-data');
          }
        },
        { type: 'separator' },
        {
          label: 'طباعة',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            mainWindow.webContents.print();
          }
        },
        { type: 'separator' },
        {
          label: 'تصدير البيانات',
          click: () => {
            exportApplicationData();
          }
        },
        {
          label: 'استيراد البيانات',
          click: () => {
            importApplicationData();
          }
        },
        { type: 'separator' },
        {
          label: process.platform === 'darwin' ? 'إغلاق' : 'خروج',
          accelerator: process.platform === 'darwin' ? 'Cmd+W' : 'Ctrl+Q',
          click: () => {
            if (process.platform !== 'darwin') {
              app.quit();
            } else {
              mainWindow.close();
            }
          }
        }
      ]
    },
    {
      label: 'تحرير',
      submenu: [
        {
          label: 'تراجع',
          accelerator: 'CmdOrCtrl+Z',
          role: 'undo'
        },
        {
          label: 'إعادة',
          accelerator: 'Shift+CmdOrCtrl+Z',
          role: 'redo'
        },
        { type: 'separator' },
        {
          label: 'قص',
          accelerator: 'CmdOrCtrl+X',
          role: 'cut'
        },
        {
          label: 'نسخ',
          accelerator: 'CmdOrCtrl+C',
          role: 'copy'
        },
        {
          label: 'لصق',
          accelerator: 'CmdOrCtrl+V',
          role: 'paste'
        },
        { type: 'separator' },
        {
          label: 'بحث',
          accelerator: 'CmdOrCtrl+F',
          click: () => {
            mainWindow.webContents.send('search');
          }
        }
      ]
    },
    {
      label: 'عرض',
      submenu: [
        {
          label: 'إعادة تحميل',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.reload();
          }
        },
        {
          label: 'تبديل أدوات المطور',
          accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        },
        { type: 'separator' },
        {
          label: 'تكبير',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(currentZoom + 0.5);
          }
        },
        {
          label: 'تصغير',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(currentZoom - 0.5);
          }
        },
        {
          label: 'إعادة تعيين الحجم',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            mainWindow.webContents.setZoomLevel(0);
          }
        },
        { type: 'separator' },
        {
          label: 'ملء الشاشة',
          accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+F' : 'F11',
          click: () => {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          }
        }
      ]
    },
    {
      label: 'أدوات',
      submenu: [
        {
          label: 'نسخة احتياطية',
          click: async () => {
            await createBackup();
          }
        },
        {
          label: 'استرداد نسخة احتياطية',
          click: async () => {
            await restoreBackup();
          }
        },
        { type: 'separator' },
        {
          label: 'تقرير شامل',
          click: () => {
            mainWindow.webContents.send('generate-comprehensive-report');
          }
        },
        {
          label: 'إحصائيات مفصلة',
          click: () => {
            mainWindow.webContents.send('show-detailed-statistics');
          }
        }
      ]
    },
    {
      label: 'مساعدة',
      submenu: [
        {
          label: 'دليل المستخدم',
          click: () => {
            mainWindow.webContents.send('show-user-guide');
          }
        },
        {
          label: 'اختصارات لوحة المفاتيح',
          click: () => {
            showKeyboardShortcuts();
          }
        },
        { type: 'separator' },
        {
          label: 'حول البرنامج',
          click: () => {
            showAboutDialog();
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function setupWindowControlHandlers() {
  // Handle window minimize
  ipcMain.handle('window-minimize', () => {
    if (mainWindow) {
      mainWindow.minimize();
      return { success: true };
    }
    return { success: false, error: 'No main window found' };
  });

  // Handle window maximize/restore toggle
  ipcMain.handle('window-toggle-maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
        return { success: true, state: 'unmaximized' };
      } else {
        mainWindow.maximize();
        return { success: true, state: 'maximized' };
      }
    }
    return { success: false, error: 'No main window found' };
  });

  // Handle window close
  ipcMain.handle('window-close', () => {
    if (mainWindow) {
      // Ask for confirmation before closing
      const choice = dialog.showMessageBoxSync(mainWindow, {
        type: 'question',
        buttons: ['إغلاق', 'إلغاء'],
        defaultId: 1,
        title: 'تأكيد الإغلاق',
        message: 'هل تريد إغلاق التطبيق؟',
        detail: 'سيتم حفظ البيانات تلقائياً قبل الإغلاق.'
      });
      
      if (choice === 0) {
        mainWindow.webContents.send('save-before-close');
        setTimeout(() => {
          app.quit();
        }, 1000);
        return { success: true };
      }
      return { success: false, reason: 'User cancelled' };
    }
    return { success: false, error: 'No main window found' };
  });

  // Get window state
  ipcMain.handle('get-window-state', () => {
    if (mainWindow) {
      return {
        isMaximized: mainWindow.isMaximized(),
        isMinimized: mainWindow.isMinimized(),
        isFullScreen: mainWindow.isFullScreen()
      };
    }
    return null;
  });
}

function setupApplicationHandlers() {
  // Save application data
  ipcMain.handle('save-app-data', async (event, data) => {
    try {
      const userDataPath = app.getPath('userData');
      const dataPath = path.join(userDataPath, 'legal-cases-data.json');
      
      const dataToSave = {
        ...data,
        lastSaved: new Date().toISOString(),
        version: '1.1.0'
      };
      
      await fs.promises.writeFile(dataPath, JSON.stringify(dataToSave, null, 2), 'utf8');
      return { success: true, path: dataPath };
    } catch (error) {
      console.error('Error saving data:', error);
      return { success: false, error: error.message };
    }
  });

  // Load application data
  ipcMain.handle('load-app-data', async () => {
    try {
      const userDataPath = app.getPath('userData');
      const dataPath = path.join(userDataPath, 'legal-cases-data.json');
      
      if (await fs.promises.access(dataPath).then(() => true).catch(() => false)) {
        const data = await fs.promises.readFile(dataPath, 'utf8');
        return { success: true, data: JSON.parse(data) };
      } else {
        return { success: true, data: null };
      }
    } catch (error) {
      console.error('Error loading data:', error);
      return { success: false, error: error.message };
    }
  });

  // Export data
  ipcMain.handle('export-data', async (event, data) => {
    try {
      const result = await dialog.showSaveDialog(mainWindow, {
        title: 'تصدير البيانات',
        defaultPath: `legal-cases-backup-${new Date().toISOString().split('T')[0]}.json`,
        filters: [
          { name: 'ملفات JSON', extensions: ['json'] },
          { name: 'جميع الملفات', extensions: ['*'] }
        ]
      });
      
      if (!result.canceled) {
        const exportData = {
          ...data,
          exportDate: new Date().toISOString(),
          version: '1.1.0'
        };
        
        await fs.promises.writeFile(result.filePath, JSON.stringify(exportData, null, 2), 'utf8');
        return { success: true, path: result.filePath };
      }
      
      return { success: false, reason: 'User cancelled' };
    } catch (error) {
      console.error('Error exporting data:', error);
      return { success: false, error: error.message };
    }
  });

  // Import data
  ipcMain.handle('import-data', async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        title: 'استيراد البيانات',
        filters: [
          { name: 'ملفات JSON', extensions: ['json'] },
          { name: 'جميع الملفات', extensions: ['*'] }
        ],
        properties: ['openFile']
      });
      
      if (!result.canceled && result.filePaths.length > 0) {
        const data = await fs.promises.readFile(result.filePaths[0], 'utf8');
        return { success: true, data: JSON.parse(data) };
      }
      
      return { success: false, reason: 'User cancelled' };
    } catch (error) {
      console.error('Error importing data:', error);
      return { success: false, error: error.message };
    }
  });

  // Print current view
  ipcMain.handle('print-view', () => {
    if (mainWindow) {
      mainWindow.webContents.print({
        silent: false,
        printBackground: true,
        margins: {
          marginType: 'minimum'
        }
      });
      return { success: true };
    }
    return { success: false };
  });
}

async function createBackup() {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'إنشاء نسخة احتياطية',
      defaultPath: `backup-${new Date().toISOString().split('T')[0]}.json`,
      filters: [
        { name: 'ملفات JSON', extensions: ['json'] },
        { name: 'جميع الملفات', extensions: ['*'] }
      ]
    });
    
    if (!result.canceled) {
      mainWindow.webContents.send('create-backup', result.filePath);
    }
  } catch (error) {
    console.error('Error creating backup:', error);
  }
}

async function restoreBackup() {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'استرداد نسخة احتياطية',
      filters: [
        { name: 'ملفات JSON', extensions: ['json'] },
        { name: 'جميع الملفات', extensions: ['*'] }
      ],
      properties: ['openFile']
    });
    
    if (!result.canceled) {
      mainWindow.webContents.send('restore-backup', result.filePaths[0]);
    }
  } catch (error) {
    console.error('Error restoring backup:', error);
  }
}

async function exportApplicationData() {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'تصدير البيانات',
      defaultPath: `legal-data-export-${new Date().toISOString().split('T')[0]}.json`,
      filters: [
        { name: 'ملفات JSON', extensions: ['json'] },
        { name: 'جميع الملفات', extensions: ['*'] }
      ]
    });
    
    if (!result.canceled) {
      mainWindow.webContents.send('export-all-data', result.filePath);
    }
  } catch (error) {
    console.error('Error exporting data:', error);
  }
}

async function importApplicationData() {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'استيراد البيانات',
      filters: [
        { name: 'ملفات JSON', extensions: ['json'] },
        { name: 'جميع الملفات', extensions: ['*'] }
      ],
      properties: ['openFile']
    });
    
    if (!result.canceled) {
      mainWindow.webContents.send('import-all-data', result.filePaths[0]);
    }
  } catch (error) {
    console.error('Error importing data:', error);
  }
}

function showKeyboardShortcuts() {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'اختصارات لوحة المفاتيح',
    message: 'اختصارات البرنامج',
    detail: `
دعوى جديدة: Ctrl+N
حفظ: Ctrl+S
طباعة: Ctrl+P
بحث: Ctrl+F
تكبير: Ctrl++
تصغير: Ctrl+-
إعادة تحميل: Ctrl+R
أدوات المطور: Ctrl+Shift+I
ملء الشاشة: F11
إغلاق: Ctrl+Q
    `,
    buttons: ['موافق']
  });
}

function showAboutDialog() {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'حول البرنامج',
    message: 'نظام إدارة الدعاوى القضائية',
    detail: `
مجموعة السيد أسامة القانونية
الإصدار 1.1.0

نظام شامل لإدارة الدعاوى القضائية والاستقطاعات
يوفر جميع الأدوات اللازمة لإدارة المكاتب القانونية

المطور: فريق التطوير القانوني
التاريخ: ${new Date().getFullYear()}
    `,
    buttons: ['موافق']
  });
}

// App event listeners
app.whenReady().then(() => {
  createWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security measures
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
  
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== 'file://') {
      event.preventDefault();
    }
  });
});

// Handle certificate errors
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  event.preventDefault();
  callback(false);
});

// Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
});