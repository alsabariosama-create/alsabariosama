/**
 * Firebase Integration for Legal Case Management System v4.0 - الإصدار المُصحح
 * نظام شامل ومتقدم للمزامنة التلقائية مع Firebase
 * يدعم الحفظ الفوري والمراقبة الشاملة للبيانات
 */

class AdvancedFirebaseManager {
    constructor() {
        this.db = null;
        this.isConnected = false;
        this.connectionStatus = 'disconnected';
        this.autoSyncInterval = null;
        this.realtimeListeners = {};
        this.dataObservers = {};
        this.connectionRetries = 0;
        this.maxRetries = 5;
        this.syncQueue = [];
        this.isProcessingQueue = false;
        this.lastSyncTime = null;
        this.pendingChanges = new Map();
        this.conflictResolution = 'client-wins';
        this.syncActivities = [];
        
        // إعدادات Firebase
        this.firebaseConfig = {
  apiKey: "AIzaSyDrZmZwSOVhonbLWGrHnctkV4tUcT7UNZM",
  authDomain: "legal-department-dbd28.firebaseapp.com",
  databaseURL: "https://legal-department-dbd28-default-rtdb.firebaseio.com",
  projectId: "legal-department-dbd28",
  storageBucket: "legal-department-dbd28.firebasestorage.app",
  messagingSenderId: "452600951683",
  appId: "1:452600951683:web:2929d22d53a309d947fcb6"
}; 

        this.changeTypes = {
            CREATE: 'create',
            UPDATE: 'update',
            DELETE: 'delete',
            BULK: 'bulk'
        };

        this.syncModes = {
            IMMEDIATE: 'immediate',
            BATCHED: 'batched',
            SCHEDULED: 'scheduled'
        };

        this.currentSyncMode = this.syncModes.IMMEDIATE;
        
        this.initializeAdvancedFirebaseUI();
        this.setupGlobalDataInterceptors();
        console.log('Firebase Advanced Integration v4.0 تم تحميله بنجاح');
    }

    // تحميل Firebase SDK
    async loadFirebaseSDK() {
        try {
            if (!window.firebase) {
                const scripts = [
                    'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js',
                    'https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js',
                    'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js'
                ];

                for (const scriptSrc of scripts) {
                    await this.loadScript(scriptSrc);
                }
                
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
            
            console.log('Firebase SDK v9.22.0 تم تحميله بنجاح');
            return true;
        } catch (error) {
            console.error('خطأ في تحميل Firebase SDK:', error);
            throw new Error(`فشل في تحميل Firebase SDK: ${error.message}`);
        }
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`فشل في تحميل: ${src}`));
            document.head.appendChild(script);
        });
    }

    // إنشاء واجهة متقدمة مع التأكد من وجود العناصر
    initializeAdvancedFirebaseUI() {
        // محاولة عدة مرات للعثور على العنصر
        this.attemptUICreation();
    }

    attemptUICreation(attempts = 0) {
        const maxAttempts = 10;
        
        // البحث عن العنصر الهدف
        let headerRight = document.querySelector('.header-right');
        
        // إذا لم نجد العنصر، نبحث عن بدائل أخرى
        if (!headerRight) {
            headerRight = document.querySelector('.header-content .header-right') ||
                         document.querySelector('.header .header-right') ||
                         document.querySelector('header .header-right') ||
                         document.querySelector('[class*="header-right"]') ||
                         document.querySelector('.user-info')?.parentElement;
        }

        if (headerRight && !document.getElementById('firebase-advanced-container')) {
            console.log('تم العثور على header-right، جاري إضافة Firebase UI...');
            
            const firebaseContainer = document.createElement('div');
            firebaseContainer.className = 'firebase-advanced-container';
            firebaseContainer.id = 'firebase-advanced-container';
            firebaseContainer.innerHTML = `
                <div class="firebase-connection disconnected" id="firebase-connection-btn">
                    <div class="firebase-icon" onclick="window.advancedFirebaseManager?.toggleConnection()">
                        <i class="fab fa-google" id="firebase-icon"></i>
                        <span class="firebase-status" id="firebase-status">منقطع</span>
                        <div class="firebase-indicator" id="firebase-indicator"></div>
                        <div class="firebase-sync-counter" id="sync-counter">0</div>
                    </div>
                    <div class="firebase-controls" id="firebase-controls">
                        <button class="firebase-control-btn" onclick="window.advancedFirebaseManager?.forceSyncAll()" title="مزامنة شاملة">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                        <button class="firebase-control-btn" onclick="window.advancedFirebaseManager?.showSyncStatus()" title="حالة المزامنة">
                            <i class="fas fa-chart-line"></i>
                        </button>
                        <button class="firebase-control-btn" onclick="window.advancedFirebaseManager?.createAutoBackup()" title="نسخة احتياطية">
                            <i class="fas fa-shield-alt"></i>
                        </button>
                    </div>
                </div>
            `;
            
            this.addAdvancedFirebaseStyles();
            
            // البحث عن أفضل مكان لإدراج الزر
            const notificationBell = headerRight.querySelector('.notification-bell');
            const userInfo = headerRight.querySelector('.user-info');
            
            if (notificationBell) {
                headerRight.insertBefore(firebaseContainer, notificationBell);
            } else if (userInfo) {
                headerRight.insertBefore(firebaseContainer, userInfo);
            } else {
                headerRight.appendChild(firebaseContainer);
            }
            
            console.log('تم إضافة Firebase UI بنجاح!');
            
            // تأكيد أن الزر مرئي
            setTimeout(() => {
                const addedElement = document.getElementById('firebase-advanced-container');
                if (addedElement) {
                    addedElement.style.display = 'flex';
                    addedElement.style.visibility = 'visible';
                    console.log('تم التأكد من ظهور Firebase UI');
                }
            }, 100);
            
        } else if (attempts < maxAttempts) {
            // إعادة المحاولة بعد فترة قصيرة
            console.log(`محاولة ${attempts + 1} من ${maxAttempts} للعثور على header-right...`);
            setTimeout(() => {
                this.attemptUICreation(attempts + 1);
            }, 500);
        } else {
            // إذا فشلت جميع المحاولات، أنشئ الزر في مكان بديل
            console.warn('لم يتم العثور على header-right، جاري إنشاء الزر في مكان بديل...');
            this.createFallbackUI();
        }
    }

    // إنشاء واجهة بديلة إذا لم نجد المكان المناسب
    createFallbackUI() {
        // البحث عن أي مكان مناسب في الهيدر
        let targetElement = document.querySelector('header') ||
                           document.querySelector('.header') ||
                           document.querySelector('body > div:first-child') ||
                           document.body;

        if (targetElement && !document.getElementById('firebase-advanced-container')) {
            const firebaseContainer = document.createElement('div');
            firebaseContainer.className = 'firebase-advanced-container firebase-fallback';
            firebaseContainer.id = 'firebase-advanced-container';
            firebaseContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                background: white;
                border-radius: 12px;
                padding: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                border: 1px solid #e5e7eb;
            `;
            
            firebaseContainer.innerHTML = `
                <div class="firebase-connection disconnected" id="firebase-connection-btn">
                    <div class="firebase-icon" onclick="window.advancedFirebaseManager?.toggleConnection()">
                        <i class="fab fa-google" id="firebase-icon"></i>
                        <span class="firebase-status" id="firebase-status">Firebase</span>
                        <div class="firebase-indicator" id="firebase-indicator"></div>
                        <div class="firebase-sync-counter" id="sync-counter">0</div>
                    </div>
                </div>
            `;
            
            this.addAdvancedFirebaseStyles();
            targetElement.appendChild(firebaseContainer);
            
            console.log('تم إنشاء Firebase UI في موقع بديل');
        }
    }

    // أنماط متقدمة للواجهة
    addAdvancedFirebaseStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .firebase-advanced-container {
                display: flex;
                align-items: center;
                margin-left: 1rem;
                position: relative;
                order: 3;
            }

            .firebase-connection {
                display: flex;
                align-items: center;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                border-radius: 1rem;
                overflow: hidden;
                background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.1);
            }

            .firebase-icon {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 1rem 1.25rem;
                border-radius: 1rem;
                background: transparent;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                min-width: 140px;
            }

            .firebase-icon:hover {
                transform: scale(1.02);
                box-shadow: 0 8px 32px rgba(0,0,0,0.12);
            }

            .firebase-icon i {
                font-size: 1.5rem;
                transition: all 0.3s ease;
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
            }

            .firebase-status {
                font-size: 0.875rem;
                font-weight: 700;
                transition: all 0.3s ease;
                text-shadow: 0 1px 2px rgba(0,0,0,0.1);
            }

            .firebase-indicator {
                position: absolute;
                top: 0.5rem;
                right: 0.5rem;
                width: 10px;
                height: 10px;
                border-radius: 50%;
                transition: all 0.3s ease;
                box-shadow: 0 0 0 2px rgba(255,255,255,0.3);
            }

            .firebase-sync-counter {
                position: absolute;
                top: -8px;
                right: -8px;
                background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                color: white;
                font-size: 0.75rem;
                font-weight: 700;
                padding: 0.25rem 0.5rem;
                border-radius: 0.5rem;
                min-width: 20px;
                text-align: center;
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
                transform: scale(0);
                transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }

            .firebase-sync-counter.active {
                transform: scale(1);
            }

            .firebase-controls {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-right: 0.75rem;
                opacity: 0;
                transform: translateX(20px);
                transition: all 0.3s ease;
            }

            .firebase-connection.connected:hover .firebase-controls {
                opacity: 1;
                transform: translateX(0);
            }

            .firebase-control-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 2rem;
                height: 2rem;
                border: none;
                border-radius: 0.5rem;
                background: rgba(255,255,255,0.1);
                color: white;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 0.875rem;
                backdrop-filter: blur(5px);
            }

            .firebase-control-btn:hover {
                background: rgba(255,255,255,0.2);
                transform: scale(1.1);
            }

            /* حالات الاتصال */
            .firebase-connection.disconnected .firebase-icon {
                background: linear-gradient(135deg, #fecaca, #fee2e2);
                border: 2px solid #ef4444;
                color: #ef4444;
            }

            .firebase-connection.disconnected .firebase-indicator {
                background: #ef4444;
                animation: pulse-error 2s infinite;
            }

            .firebase-connection.connecting .firebase-icon {
                background: linear-gradient(135deg, #fef3c7, #fde68a);
                border: 2px solid #f59e0b;
                color: #f59e0b;
            }

            .firebase-connection.connecting .firebase-indicator {
                background: #f59e0b;
                animation: spin 1s linear infinite;
            }

            .firebase-connection.connected .firebase-icon {
                background: linear-gradient(135deg, #d1fae5, #a7f3d0);
                border: 2px solid #10b981;
                color: #10b981;
            }

            .firebase-connection.connected .firebase-indicator {
                background: #10b981;
                animation: heartbeat 2s infinite;
            }

            .firebase-connection.syncing .firebase-icon {
                background: linear-gradient(135deg, #ddd6fe, #c4b5fd);
                border: 2px solid #8b5cf6;
                color: #8b5cf6;
            }

            .firebase-connection.syncing .firebase-indicator {
                background: #8b5cf6;
                animation: sync-pulse 1s infinite;
            }

            @keyframes pulse-error {
                0%, 100% { 
                    transform: scale(1); 
                    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
                }
                50% { 
                    transform: scale(1.1); 
                    box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
                }
            }

            @keyframes heartbeat {
                0%, 100% { transform: scale(1); }
                25% { transform: scale(1.1); }
                50% { transform: scale(1); }
                75% { transform: scale(1.1); }
            }

            @keyframes sync-pulse {
                0%, 100% { 
                    transform: scale(1); 
                    background: #8b5cf6;
                }
                50% { 
                    transform: scale(1.2); 
                    background: #a855f7;
                }
            }

            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    // إعداد مراقبي البيانات العامة
    setupGlobalDataInterceptors() {
        const self = this;
        
        // حفظ الوظائف الأصلية
        if (!window.__originalFirebaseFunctions) {
            window.__originalFirebaseFunctions = {
                saveToLocalStorage: window.saveToLocalStorage,
                dataManagerSaveData: window.dataManager?.saveData
            };
        }

        // اعتراض DataManager.saveData
        if (window.dataManager) {
            const originalSaveData = window.dataManager.saveData;
            window.dataManager.saveData = function() {
                const result = originalSaveData.call(this);
                if (self.isConnected) {
                    self.syncAllDataAdvanced();
                }
                return result;
            };

            this.observeDataChanges();
        }

        console.log('تم إعداد مراقبي البيانات العامة');
    }

    // مراقبة تغييرات البيانات
    observeDataChanges() {
        const self = this;
        
        // مراقبة البيانات الرئيسية
        const dataKeys = ['casesData', 'defendantsData', 'lawyersData', 'deductionsData', 'notificationsData', 'settingsData'];
        
        dataKeys.forEach(key => {
            this.createDataProxy(key);
        });

        // مراقبة دورية للتغييرات
        setInterval(() => {
            if (this.isConnected) {
                this.detectDataChanges();
            }
        }, 3000);
    }

    // إنشاء Proxy للبيانات
    createDataProxy(dataKey) {
        if (!window.dataManager || !window.dataManager[dataKey]) return;

        const self = this;
        const originalData = window.dataManager[dataKey];
        
        // لا نعيد تعريف إذا كان Proxy موجود بالفعل
        if (originalData && originalData.__isProxy) return;
        
        try {
            window.dataManager[dataKey] = new Proxy(originalData, {
                set(target, property, value) {
                    const oldValue = target[property];
                    target[property] = value;
                    
                    if (self.isConnected && oldValue !== value) {
                        self.queueDataChange(dataKey, { [property]: value }, self.changeTypes.UPDATE);
                    }
                    
                    return true;
                },
                
                deleteProperty(target, property) {
                    const oldValue = target[property];
                    delete target[property];
                    
                    if (self.isConnected) {
                        self.queueDataChange(dataKey, { [property]: oldValue }, self.changeTypes.DELETE);
                    }
                    
                    return true;
                }
            });
            
            // تعليم البيانات كـ Proxy
            if (window.dataManager[dataKey]) {
                window.dataManager[dataKey].__isProxy = true;
            }
        } catch (error) {
            console.warn(`لا يمكن إنشاء Proxy لـ ${dataKey}:`, error);
        }
    }

    // كشف تغييرات البيانات
    detectDataChanges() {
        if (!window.dataManager) return;

        const currentHashes = this.generateDataHashes();
        const lastHashes = this.lastDataHashes || {};

        for (const [key, hash] of Object.entries(currentHashes)) {
            if (lastHashes[key] !== hash) {
                this.queueDataChange(key, window.dataManager[key], this.changeTypes.UPDATE);
            }
        }

        this.lastDataHashes = currentHashes;
    }

    // إنشاء تجمعات البيانات
    generateDataHashes() {
        const hashes = {};
        const dataKeys = ['casesData', 'defendantsData', 'lawyersData', 'deductionsData', 'notificationsData', 'settingsData'];
        
        dataKeys.forEach(key => {
            if (window.dataManager && window.dataManager[key]) {
                hashes[key] = this.generateHash(JSON.stringify(window.dataManager[key]));
            }
        });

        return hashes;
    }

    // إنشاء تجمع البيانات
    generateHash(str) {
        let hash = 0;
        if (str.length === 0) return hash;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash;
    }

    // إضافة التغيير إلى الطابور
    queueDataChange(key, data, changeType) {
        const changeId = Date.now() + Math.random().toString(36).substr(2, 9);
        const change = {
            id: changeId,
            key,
            data,
            type: changeType,
            timestamp: new Date().toISOString(),
            retries: 0,
            maxRetries: 3
        };

        this.syncQueue.push(change);
        this.updateSyncCounter();

        if (this.currentSyncMode === this.syncModes.IMMEDIATE) {
            this.processQueue();
        }

        this.pendingChanges.set(changeId, change);
    }

    // معالجة طابور التزامن
    async processQueue() {
        if (this.isProcessingQueue || this.syncQueue.length === 0) return;

        this.isProcessingQueue = true;
        this.updateConnectionStatus('syncing', 'جاري المزامنة...');

        const batchSize = 10;
        const batch = this.syncQueue.splice(0, batchSize);

        try {
            await this.processBatch(batch);
            this.updateSyncCounter();
            
            if (this.syncQueue.length > 0) {
                setTimeout(() => this.processQueue(), 100);
            } else {
                this.updateConnectionStatus('connected', 'متصل');
            }
        } catch (error) {
            console.error('خطأ في معالجة طابور المزامنة:', error);
            batch.forEach(item => {
                if (item.retries < item.maxRetries) {
                    item.retries++;
                    this.syncQueue.unshift(item);
                }
            });
        } finally {
            this.isProcessingQueue = false;
        }
    }

    // معالجة دفعة من التغييرات
    async processBatch(batch) {
        const updates = {};
        const timestamp = new Date().toISOString();

        for (const change of batch) {
            try {
                const path = this.getFirebasePath(change.key);
                
                switch (change.type) {
                    case this.changeTypes.CREATE:
                    case this.changeTypes.UPDATE:
                        if (Array.isArray(change.data)) {
                            change.data.forEach((item) => {
                                if (item && typeof item === 'object' && item.id) {
                                    // استخدم مفتاح العنصر مباشرة بدون "item_" ليتوافق مع صفحة المحامي
                                    updates[`${path}/${item.id}`] = {
                                        ...item,
                                        lastSync: timestamp,
                                        syncVersion: '4.0'
                                    };
                                }
                            });
                        } else if (typeof change.data === 'object') {
                            updates[path] = {
                                ...change.data,
                                lastSync: timestamp,
                                syncVersion: '4.0'
                            };
                        }
                        break;
                        
                    case this.changeTypes.DELETE:
                        // للحذف، نحتاج معرف العنصر المحدد
                        if (change.data && change.data.id) {
                            updates[`${path}/${change.data.id}`] = null;
                        } else {
                            updates[path] = null;
                        }
                        break;
                }

                this.pendingChanges.delete(change.id);
                
            } catch (error) {
                console.error(`خطأ في معالجة التغيير ${change.id}:`, error);
                throw error;
            }
        }

        updates['system/status/lastBatchSync'] = timestamp;
        updates['system/status/batchSize'] = batch.length;
        updates['system/status/pendingChanges'] = this.syncQueue.length;

        await this.db.ref().update(updates);
        
        this.lastSyncTime = timestamp;
        this.recordSyncActivity(`تم مزامنة ${batch.length} تغيير`, 'success');
    }

    // الحصول على مسار Firebase
    getFirebasePath(key) {
        const pathMapping = {
            'casesData': 'legal_data/cases/active',
            'defendantsData': 'legal_data/clients/active',
            'lawyersData': 'legal_data/lawyers/active',
            'deductionsData': 'legal_data/deductions/payments',
            'notificationsData': 'notifications/user',
            'settingsData': 'settings/user'
        };

        return pathMapping[key] || `legal_data/misc/${key}`;
    }

    // تسجيل نشاط المزامنة
    recordSyncActivity(message, type = 'info') {
        const activity = {
            timestamp: new Date().toISOString(),
            message,
            type,
            id: Date.now()
        };

        if (!this.syncActivities) {
            this.syncActivities = [];
        }

        this.syncActivities.unshift(activity);
        
        if (this.syncActivities.length > 100) {
            this.syncActivities = this.syncActivities.slice(0, 100);
        }

        if (this.db) {
            this.db.ref(`system/status/activities/${activity.id}`).set(activity);
        }
    }

    // تحديث عداد المزامنة
    updateSyncCounter() {
        const counter = document.getElementById('sync-counter');
        if (counter) {
            const pendingCount = this.syncQueue.length + this.pendingChanges.size;
            counter.textContent = pendingCount;
            
            if (pendingCount > 0) {
                counter.classList.add('active');
            } else {
                counter.classList.remove('active');
            }
        }
    }

    // الاتصال المتقدم
    async connect() {
        try {
            this.updateConnectionStatus('connecting', 'جاري الاتصال...');
            
            await this.loadFirebaseSDK();
            
            if (!window.firebase) {
                throw new Error('فشل في تحميل Firebase SDK');
            }
            
            if (!firebase.apps.length) {
                firebase.initializeApp(this.firebaseConfig);
                console.log('تم تهيئة Firebase بنجاح');
            }
            
            this.db = firebase.database();
            
            await this.createAdvancedDatabaseStructure();
            await this.testConnectionWithRetry();
            
            this.isConnected = true;
            this.connectionRetries = 0;
            this.updateConnectionStatus('connected', 'متصل');
            
            await this.initializeDataSync();
            this.setupAdvancedRealtimeListeners();
            this.startAdvancedAutoSync();
            
            setTimeout(() => this.createAutoBackup(), 5000);
            
            this.showAdvancedConnectionModal();
            this.showFirebaseNotification('Firebase متصل', 'تم الاتصال المتقدم بقاعدة البيانات بنجاح', 'success');
            
        } catch (error) {
            console.error('خطأ في الاتصال بـ Firebase:', error);
            this.handleAdvancedConnectionError(error);
        }
    }

    // معالجة أخطاء الاتصال المتقدمة
    async handleAdvancedConnectionError(error) {
        this.connectionRetries++;
        
        console.error(`خطأ في الاتصال (المحاولة ${this.connectionRetries}):`, error.message);
        
        const errorTypes = {
            'permission denied': {
                status: 'disconnected',
                message: 'مرفوض الصلاحية',
                notification: 'خطأ في الصلاحيات - تحقق من إعدادات Firebase Security Rules'
            },
            'invalid key': {
                status: 'disconnected',
                message: 'خطأ في البيانات',
                notification: 'خطأ في هيكل البيانات - سيتم إصلاحه تلقائياً'
            },
            'network': {
                status: 'connecting',
                message: 'مشكلة في الشبكة',
                notification: 'مشكلة في الاتصال بالإنترنت'
            }
        };

        const errorType = Object.keys(errorTypes).find(type => 
            error.message.toLowerCase().includes(type)
        );

        if (errorType) {
            const config = errorTypes[errorType];
            this.updateConnectionStatus(config.status, config.message);
            this.showFirebaseNotification('خطأ في الاتصال', config.notification, 'error');
            
            if (errorType === 'permission denied') {
                return;
            }
        }
        
        if (this.connectionRetries < this.maxRetries) {
            console.log(`محاولة إعادة الاتصال ${this.connectionRetries}/${this.maxRetries}`);
            this.updateConnectionStatus('connecting', `إعادة محاولة ${this.connectionRetries}...`);
            
            const delay = Math.min(2000 * Math.pow(2, this.connectionRetries - 1), 30000);
            setTimeout(() => this.connect(), delay);
        } else {
            this.isConnected = false;
            this.updateConnectionStatus('disconnected', 'فشل الاتصال');
            this.showFirebaseNotification('فشل الاتصال', 'فشل في الاتصال بقاعدة البيانات بعد عدة محاولات', 'error');
            
            this.recordSyncActivity(`فشل الاتصال نهائياً: ${error.message}`, 'error');
        }
    }

    // إنشاء هيكل قاعدة بيانات متقدم
    async createAdvancedDatabaseStructure() {
        console.log('إنشاء هيكل قاعدة البيانات المتقدم...');
        
        const structureUpdates = {};
        const timestamp = new Date().toISOString();
        
        const sections = ['legal_data', 'system', 'notifications', 'settings', 'backups'];
        
        sections.forEach(section => {
            structureUpdates[`${section}/_metadata`] = {
                created: timestamp,
                version: '4.0',
                structure: 'advanced'
            };
        });
        
        structureUpdates['system/info'] = {
            initialized: timestamp,
            version: '4.0',
            appName: 'Legal Case Management System',
            features: [
                'advanced-sync',
                'real-time-updates',
                'auto-backup'
            ],
            lastStructureUpdate: timestamp
        };

        structureUpdates['system/status'] = {
            syncMode: this.currentSyncMode,
            lastSync: timestamp,
            pendingChanges: 0,
            totalSyncs: 0,
            errors: 0
        };

        await this.db.ref().update(structureUpdates);
        console.log('تم إنشاء هيكل قاعدة البيانات المتقدم');
    }

    // اختبار الاتصال مع إعادة المحاولة
    async testConnectionWithRetry() {
        const maxTestRetries = 3;
        let testRetries = 0;
        
        while (testRetries < maxTestRetries) {
            try {
                await this.testConnection();
                return true;
            } catch (error) {
                testRetries++;
                console.log(`فشل اختبار الاتصال (المحاولة ${testRetries}):`, error.message);
                
                if (testRetries < maxTestRetries) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * testRetries));
                } else {
                    throw error;
                }
            }
        }
    }

    // اختبار الاتصال المحسن
    async testConnection() {
        return new Promise((resolve, reject) => {
            console.log('اختبار الاتصال المتقدم...');
            
            const testRef = this.db.ref('system/status/connection_test');
            const testData = {
                timestamp: new Date().toISOString(),
                status: 'testing',
                version: '4.0',
                testId: Math.random().toString(36).substr(2, 12)
            };
            
            const timeout = setTimeout(() => {
                reject(new Error('انتهت مهلة اختبار الاتصال'));
            }, 10000);
            
            testRef.set(testData)
                .then(() => testRef.once('value'))
                .then((snapshot) => {
                    const data = snapshot.val();
                    if (data && data.status === 'testing' && data.testId === testData.testId) {
                        return testRef.remove();
                    } else {
                        throw new Error('فشل في التحقق من بيانات الاختبار');
                    }
                })
                .then(() => {
                    clearTimeout(timeout);
                    console.log('تم اختبار الاتصال المتقدم بنجاح');
                    this.recordSyncActivity('تم اختبار الاتصال بنجاح', 'success');
                    resolve(true);
                })
                .catch((error) => {
                    clearTimeout(timeout);
                    console.error('خطأ في اختبار الاتصال:', error);
                    this.recordSyncActivity(`فشل اختبار الاتصال: ${error.message}`, 'error');
                    reject(error);
                });
        });
    }

    // تهيئة مزامنة البيانات
    async initializeDataSync() {
        console.log('تهيئة مزامنة البيانات المتقدمة...');
        
        try {
            await this.loadAllDataFromFirebase();
            await this.syncAllDataAdvanced();
            
            console.log('تم تهيئة مزامنة البيانات بنجاح');
            this.recordSyncActivity('تم تهيئة المزامنة المتقدمة', 'success');
            
        } catch (error) {
            console.error('خطأ في تهيئة مزامنة البيانات:', error);
            this.recordSyncActivity(`خطأ في التهيئة: ${error.message}`, 'error');
            throw error;
        }
    }

    // تحميل جميع البيانات من Firebase
    async loadAllDataFromFirebase() {
        console.log('تحميل جميع البيانات من Firebase...');
        
        try {
            const sections = [
                { key: 'casesData', path: 'legal_data/cases/active' },
                { key: 'defendantsData', path: 'legal_data/clients/active' },
                { key: 'lawyersData', path: 'legal_data/lawyers/active' },
                { key: 'deductionsData', path: 'legal_data/deductions/payments' },
                { key: 'notificationsData', path: 'notifications/user' },
                { key: 'settingsData', path: 'settings/user' }
            ];
            
            const promises = sections.map(section => this.loadSectionDataAdvanced(section));
            await Promise.all(promises);
            
            this.refreshAllUI();
            console.log('تم تحميل جميع البيانات بنجاح');
            this.recordSyncActivity('تم تحميل جميع البيانات من Firebase', 'success');
            
        } catch (error) {
            console.error('خطأ في تحميل البيانات:', error);
            this.recordSyncActivity(`خطأ في تحميل البيانات: ${error.message}`, 'error');
            throw error;
        }
    }

    // تحميل بيانات قسم متقدم
    async loadSectionDataAdvanced(section) {
        try {
            const snapshot = await this.db.ref(section.path).once('value');
            
            if (snapshot.exists()) {
                const data = snapshot.val();
                await this.processSectionDataAdvanced(section.key, data);
                console.log(`تم تحميل بيانات ${section.key} من ${section.path}`);
            } else {
                console.log(`لا توجد بيانات في ${section.path}`);
            }
        } catch (error) {
            console.error(`خطأ في تحميل ${section.key}:`, error);
            throw error;
        }
    }

    // معالجة بيانات الأقسام المتقدمة
    async processSectionDataAdvanced(key, data) {
        if (!window.dataManager) {
            console.warn('DataManager غير متوفر');
            return;
        }

        try {
            let processedData = [];
            
            if (data && typeof data === 'object') {
                processedData = Object.values(data).filter(item => 
                    item && typeof item === 'object' && !item._metadata
                );
            }

            switch (key) {
                case 'casesData':
                    if (processedData.length > 0) {
                        window.dataManager.casesData = processedData;
                        window.dataManager.filteredCases = [...processedData];
                    }
                    break;
                    
                case 'defendantsData':
                    if (processedData.length > 0) {
                        window.dataManager.defendantsData = processedData;
                        window.dataManager.filteredDefendants = [...processedData];
                    }
                    break;
                    
                case 'lawyersData':
                    if (processedData.length > 0) {
                        window.dataManager.lawyersData = processedData;
                        window.dataManager.filteredLawyers = [...processedData];
                    }
                    break;
                    
                case 'deductionsData':
                    if (processedData.length > 0) {
                        window.dataManager.deductionsData = processedData;
                        window.dataManager.filteredDeductions = [...processedData];
                    }
                    break;
                    
                case 'notificationsData':
                    if (processedData.length > 0) {
                        window.dataManager.notificationsData = processedData;
                    }
                    break;
                    
                case 'settingsData':
                    if (Object.keys(data).length > 0) {
                        window.dataManager.settingsData = { ...window.dataManager.settingsData, ...data };
                    }
                    break;
            }

            console.log(`تم معالجة ${processedData.length} عنصر من ${key}`);
            
        } catch (error) {
            console.error(`خطأ في معالجة بيانات ${key}:`, error);
            throw error;
        }
    }

    // مزامنة جميع البيانات المتقدمة
    async syncAllDataAdvanced() {
        if (!this.isConnected || !this.db || !window.dataManager) return;

        try {
            console.log('بدء المزامنة الشاملة المتقدمة...');
            this.updateConnectionStatus('syncing', 'مزامنة شاملة...');
            
            const updates = {};
            const timestamp = new Date().toISOString();

            await this.prepareCasesSyncAdvanced(updates, timestamp);
            await this.prepareDefendantsSyncAdvanced(updates, timestamp);
            await this.prepareLawyersSyncAdvanced(updates, timestamp);
            await this.prepareDeductionsSyncAdvanced(updates, timestamp);
            await this.prepareNotificationsSyncAdvanced(updates, timestamp);
            await this.prepareSettingsSyncAdvanced(updates, timestamp);
            
            updates['system/status/lastFullSync'] = timestamp;
            updates['system/status/version'] = '4.0';

            const startTime = Date.now();
            await this.db.ref().update(updates);
            const syncTime = Date.now() - startTime;
            
            this.recordSyncActivity(`مزامنة شاملة اكتملت في ${syncTime}ms`, 'success');
            
            this.lastSyncTime = timestamp;
            this.updateConnectionStatus('connected', 'متصل');
            
            console.log('تمت المزامنة الشاملة المتقدمة بنجاح');
            
        } catch (error) {
            console.error('خطأ في المزامنة الشاملة:', error);
            this.recordSyncActivity(`خطأ في المزامنة: ${error.message}`, 'error');
            this.updateConnectionStatus('connected', 'خطأ في المزامنة');
            throw error;
        }
    }

    // تحضير مزامنة الدعاوى المتقدمة
    async prepareCasesSyncAdvanced(updates, timestamp) {
        if (!window.dataManager.casesData || window.dataManager.casesData.length === 0) return;

        const casesData = {
            active: {},
            completed: {},
            pending: {},
            statistics: {
                total: window.dataManager.casesData.length,
                lastUpdated: timestamp
            }
        };

        window.dataManager.casesData.forEach(caseItem => {
            const caseKey = `case_${caseItem.id}`;
            const enhancedCase = {
                ...caseItem,
                lastSynced: timestamp,
                syncVersion: '4.0',
                metadata: {
                    createdAt: caseItem.createdAt || timestamp,
                    lastUpdate: caseItem.lastUpdate || timestamp,
                    syncs: (caseItem.syncs || 0) + 1
                }
            };

            if (caseItem.status === 'تنفيذ' || caseItem.status === 'مغلقة') {
                casesData.completed[caseKey] = enhancedCase;
            } else if (caseItem.status === 'تحت المراجعة' || caseItem.status === 'في المحكمة') {
                casesData.pending[caseKey] = enhancedCase;
            } else {
                casesData.active[caseKey] = enhancedCase;
            }
        });

        updates['legal_data/cases'] = casesData;
    }

    // تحضير مزامنة المدعى عليهم المتقدمة
    async prepareDefendantsSyncAdvanced(updates, timestamp) {
        if (!window.dataManager.defendantsData || window.dataManager.defendantsData.length === 0) return;

        const defendantsData = {
            active: {},
            profiles: {},
            statistics: {
                total: window.dataManager.defendantsData.length,
                lastUpdated: timestamp
            }
        };

        window.dataManager.defendantsData.forEach(defendant => {
            const defendantKey = `defendant_${defendant.id}`;
            const enhancedDefendant = {
                ...defendant,
                lastSynced: timestamp,
                syncVersion: '4.0',
                metadata: {
                    createdAt: defendant.createdAt || timestamp,
                    syncs: (defendant.syncs || 0) + 1
                }
            };

            defendantsData.active[defendantKey] = enhancedDefendant;
            defendantsData.profiles[defendantKey] = {
                personalInfo: {
                    name: defendant.name,
                    phone: defendant.phone || '',
                    email: defendant.email || '',
                    address: defendant.address || '',
                    workplace: defendant.workplace || ''
                },
                caseInfo: {
                    casesCount: defendant.casesCount || 0,
                    registrationDate: defendant.registrationDate
                },
                lastSynced: timestamp
            };
        });

        updates['legal_data/clients'] = defendantsData;
    }

    // تحضير مزامنة المحامين المتقدمة
    async prepareLawyersSyncAdvanced(updates, timestamp) {
        if (!window.dataManager.lawyersData || window.dataManager.lawyersData.length === 0) return;

        const lawyersData = {
            active: {},
            profiles: {},
            specializations: {},
            statistics: {
                total: window.dataManager.lawyersData.length,
                lastUpdated: timestamp
            }
        };

        const specializationCounts = {};

        window.dataManager.lawyersData.forEach(lawyer => {
            const lawyerKey = `lawyer_${lawyer.id}`;
            const enhancedLawyer = {
                ...lawyer,
                lastSynced: timestamp,
                syncVersion: '4.0',
                metadata: {
                    createdAt: lawyer.createdAt || timestamp,
                    syncs: (lawyer.syncs || 0) + 1
                }
            };

            lawyersData.active[lawyerKey] = enhancedLawyer;
            lawyersData.profiles[lawyerKey] = {
                personalInfo: {
                    name: lawyer.name,
                    license: lawyer.license,
                    phone: lawyer.phone || '',
                    email: lawyer.email || '',
                    address: lawyer.address || ''
                },
                professionalInfo: {
                    specialization: lawyer.specialization,
                    experience: lawyer.experience || 0,
                    casesCount: lawyer.casesCount || 0,
                    registrationDate: lawyer.registrationDate
                },
                lastSynced: timestamp
            };

            const spec = lawyer.specialization;
            specializationCounts[spec] = (specializationCounts[spec] || 0) + 1;
        });

        lawyersData.specializations = specializationCounts;
        updates['legal_data/lawyers'] = lawyersData;
    }

    // تحضير مزامنة الاستقطاعات المتقدمة
    async prepareDeductionsSyncAdvanced(updates, timestamp) {
        if (!window.dataManager.deductionsData || window.dataManager.deductionsData.length === 0) return;

        const deductionsData = {
            payments: {},
            pending: {},
            completed: {},
            summary: {
                totalAmount: window.dataManager.deductionsData.reduce((sum, d) => sum + (d.amount || 0), 0),
                totalCount: window.dataManager.deductionsData.length,
                lastUpdated: timestamp
            }
        };

        window.dataManager.deductionsData.forEach(deduction => {
            const deductionKey = `deduction_${deduction.id}`;
            const enhancedDeduction = {
                ...deduction,
                lastSynced: timestamp,
                syncVersion: '4.0',
                metadata: {
                    createdAt: deduction.createdAt || timestamp,
                    syncs: (deduction.syncs || 0) + 1
                }
            };

            if (deduction.status === 'مستلم') {
                deductionsData.completed[deductionKey] = enhancedDeduction;
            } else if (deduction.status === 'قيد المعالجة') {
                deductionsData.pending[deductionKey] = enhancedDeduction;
            } else {
                deductionsData.payments[deductionKey] = enhancedDeduction;
            }
        });

        updates['legal_data/deductions'] = deductionsData;
    }

    // تحضير مزامنة الإشعارات المتقدمة
    async prepareNotificationsSyncAdvanced(updates, timestamp) {
        if (!window.dataManager.notificationsData || window.dataManager.notificationsData.length === 0) return;

        const notificationsData = {
            user: {},
            system: {},
            alerts: {},
            statistics: {
                total: window.dataManager.notificationsData.length,
                unread: window.dataManager.notificationsData.filter(n => !n.read).length,
                lastUpdated: timestamp
            }
        };

        window.dataManager.notificationsData.forEach(notification => {
            const notificationKey = `notification_${notification.id}`;
            const enhancedNotification = {
                ...notification,
                lastSynced: timestamp,
                syncVersion: '4.0'
            };

            if (notification.type === 'system') {
                notificationsData.system[notificationKey] = enhancedNotification;
            } else if (notification.type === 'alert') {
                notificationsData.alerts[notificationKey] = enhancedNotification;
            } else {
                notificationsData.user[notificationKey] = enhancedNotification;
            }
        });

        updates['notifications'] = notificationsData;
    }

    // تحضير مزامنة الإعدادات المتقدمة
    async prepareSettingsSyncAdvanced(updates, timestamp) {
        if (!window.dataManager.settingsData) return;

        const settingsData = {
            user: {
                ...window.dataManager.settingsData,
                lastSynced: timestamp,
                syncVersion: '4.0'
            },
            system: {
                syncMode: this.currentSyncMode,
                conflictResolution: this.conflictResolution,
                autoBackup: true,
                version: '4.0',
                lastUpdated: timestamp
            },
            office: {
                name: window.dataManager.settingsData.officeName || 'مجموعة السيد أسامة القانونية',
                address: window.dataManager.settingsData.officeAddress || '',
                phone: window.dataManager.settingsData.officePhone || '',
                lastUpdated: timestamp
            }
        };

        updates['settings'] = settingsData;
    }

    // إعداد مستمعي الوقت الفعلي المتقدمة
    setupAdvancedRealtimeListeners() {
        if (!this.db) return;

        console.log('إعداد مستمعي الوقت الفعلي المتقدمة...');

        const sections = [
            { path: 'legal_data/cases/active', handler: this.handleCasesUpdate.bind(this) },
            { path: 'legal_data/clients/active', handler: this.handleClientsUpdate.bind(this) },
            { path: 'legal_data/lawyers/active', handler: this.handleLawyersUpdate.bind(this) },
            { path: 'legal_data/deductions/payments', handler: this.handleDeductionsUpdate.bind(this) },
            { path: 'notifications/user', handler: this.handleNotificationsUpdate.bind(this) },
            { path: 'settings/user', handler: this.handleSettingsUpdate.bind(this) }
        ];

        sections.forEach(section => {
            this.realtimeListeners[section.path] = this.db.ref(section.path);
            
            this.realtimeListeners[section.path].on('value', (snapshot) => {
                if (snapshot.exists()) {
                    console.log(`تحديث من Firebase: ${section.path}`);
                    section.handler(snapshot.val());
                    this.recordSyncActivity(`تحديث في الوقت الفعلي: ${section.path}`, 'info');
                }
            });
        });

        console.log('تم إعداد مستمعي الوقت الفعلي بنجاح');
    }

    // معالج تحديث الدعاوى
    handleCasesUpdate(data) {
        if (!window.dataManager || !data) return;
        
        try {
            const remoteCases = Object.values(data).filter(item => item && !item._metadata);
            
            if (this.shouldUpdateLocalData('casesData', remoteCases)) {
                window.dataManager.casesData = remoteCases;
                window.dataManager.filteredCases = [...remoteCases];
                
                if (typeof window.renderCasesTable === 'function') {
                    window.renderCasesTable();
                }
                if (typeof window.updateDashboardStats === 'function') {
                    window.updateDashboardStats();
                }
                
                this.showFirebaseNotification('تحديث الدعاوى', 'تم تحديث الدعاوى من الخادم', 'info');
            }
        } catch (error) {
            console.error('خطأ في معالجة تحديث الدعاوى:', error);
            this.recordSyncActivity(`خطأ في تحديث الدعاوى: ${error.message}`, 'error');
        }
    }

    // معالج تحديث العملاء
    handleClientsUpdate(data) {
        if (!window.dataManager || !data) return;
        
        try {
            const remoteClients = Object.values(data).filter(item => item && !item._metadata);
            
            if (this.shouldUpdateLocalData('defendantsData', remoteClients)) {
                window.dataManager.defendantsData = remoteClients;
                window.dataManager.filteredDefendants = [...remoteClients];
                
                if (typeof window.renderDefendantsTable === 'function') {
                    window.renderDefendantsTable();
                }
                
                this.showFirebaseNotification('تحديث العملاء', 'تم تحديث المدعى عليهم من الخادم', 'info');
            }
        } catch (error) {
            console.error('خطأ في معالجة تحديث العملاء:', error);
            this.recordSyncActivity(`خطأ في تحديث العملاء: ${error.message}`, 'error');
        }
    }

    // معالج تحديث المحامين
    handleLawyersUpdate(data) {
        if (!window.dataManager || !data) return;
        
        try {
            const remoteLawyers = Object.values(data).filter(item => item && !item._metadata);
            
            if (this.shouldUpdateLocalData('lawyersData', remoteLawyers)) {
                window.dataManager.lawyersData = remoteLawyers;
                window.dataManager.filteredLawyers = [...remoteLawyers];
                
                if (typeof window.renderLawyersTable === 'function') {
                    window.renderLawyersTable();
                }
                if (typeof window.updateLawyerSelector === 'function') {
                    window.updateLawyerSelector();
                }
                
                this.showFirebaseNotification('تحديث المحامين', 'تم تحديث المحامين من الخادم', 'info');
            }
        } catch (error) {
            console.error('خطأ في معالجة تحديث المحامين:', error);
            this.recordSyncActivity(`خطأ في تحديث المحامين: ${error.message}`, 'error');
        }
    }

    // معالج تحديث الاستقطاعات
    handleDeductionsUpdate(data) {
        if (!window.dataManager || !data) return;
        
        try {
            const remoteDeductions = Object.values(data).filter(item => item && !item._metadata);
            
            if (this.shouldUpdateLocalData('deductionsData', remoteDeductions)) {
                window.dataManager.deductionsData = remoteDeductions;
                window.dataManager.filteredDeductions = [...remoteDeductions];
                
                if (typeof window.renderDeductionsTable === 'function') {
                    window.renderDeductionsTable();
                }
                if (typeof window.updateDashboardStats === 'function') {
                    window.updateDashboardStats();
                }
                
                this.showFirebaseNotification('تحديث الاستقطاعات', 'تم تحديث الاستقطاعات من الخادم', 'info');
            }
        } catch (error) {
            console.error('خطأ في معالجة تحديث الاستقطاعات:', error);
            this.recordSyncActivity(`خطأ في تحديث الاستقطاعات: ${error.message}`, 'error');
        }
    }

    // معالج تحديث الإشعارات
    handleNotificationsUpdate(data) {
        if (!window.dataManager || !data) return;
        
        try {
            const remoteNotifications = Object.values(data).filter(item => item && !item._metadata);
            
            if (this.shouldUpdateLocalData('notificationsData', remoteNotifications)) {
                window.dataManager.notificationsData = remoteNotifications;
                
                if (typeof window.dataManager.updateNotificationBadge === 'function') {
                    window.dataManager.updateNotificationBadge();
                }
                if (typeof window.renderAlerts === 'function') {
                    window.renderAlerts();
                }
                
                this.showFirebaseNotification('إشعارات جديدة', 'تم تحديث الإشعارات من الخادم', 'info');
            }
        } catch (error) {
            console.error('خطأ في معالجة تحديث الإشعارات:', error);
            this.recordSyncActivity(`خطأ في تحديث الإشعارات: ${error.message}`, 'error');
        }
    }

    // معالج تحديث الإعدادات
    handleSettingsUpdate(data) {
        if (!window.dataManager || !data) return;
        
        try {
            if (this.shouldUpdateLocalData('settingsData', data)) {
                window.dataManager.settingsData = { ...window.dataManager.settingsData, ...data };
                
                if (typeof window.loadSettings === 'function') {
                    window.loadSettings();
                }
                
                this.showFirebaseNotification('تحديث الإعدادات', 'تم تحديث الإعدادات من الخادم', 'info');
            }
        } catch (error) {
            console.error('خطأ في معالجة تحديث الإعدادات:', error);
            this.recordSyncActivity(`خطأ في تحديث الإعدادات: ${error.message}`, 'error');
        }
    }

    // تحديد ما إذا كان يجب تحديث البيانات المحلية
    shouldUpdateLocalData(dataKey, remoteData) {
        if (!window.dataManager || !window.dataManager[dataKey]) return true;

        const localData = window.dataManager[dataKey];
        
        try {
            const localHash = this.generateHash(JSON.stringify(localData));
            const remoteHash = this.generateHash(JSON.stringify(remoteData));
            
            if (localHash === remoteHash) {
                return false;
            }

            if (this.conflictResolution === 'server-wins') {
                return true;
            } else if (this.conflictResolution === 'client-wins') {
                return false;
            } else {
                return this.shouldMergeData(localData, remoteData);
            }
            
        } catch (error) {
            console.error('خطأ في مقارنة البيانات:', error);
            return true;
        }
    }

    // تحديد ما إذا كان يجب دمج البيانات
    shouldMergeData(localData, remoteData) {
        try {
            if (Array.isArray(localData) && Array.isArray(remoteData)) {
                return remoteData.length > localData.length;
            } else if (typeof localData === 'object' && typeof remoteData === 'object') {
                const localUpdate = localData.lastUpdate || localData.lastSynced || '1970-01-01';
                const remoteUpdate = remoteData.lastUpdate || remoteData.lastSynced || '1970-01-01';
                return new Date(remoteUpdate) > new Date(localUpdate);
            }
        } catch (error) {
            console.error('خطأ في منطق دمج البيانات:', error);
        }
        
        return true;
    }

    // بدء المزامنة التلقائية المتقدمة
    startAdvancedAutoSync() {
        this.autoSyncInterval = setInterval(() => {
            if (this.isConnected && this.syncQueue.length > 0) {
                this.processQueue();
            }
        }, 1000);

        this.fullSyncInterval = setInterval(() => {
            if (this.isConnected) {
                this.syncAllDataAdvanced();
            }
        }, 60000);

        this.autoBackupInterval = setInterval(() => {
            if (this.isConnected) {
                this.createAutoBackup();
            }
        }, 300000);

        console.log('تم بدء المزامنة التلقائية المتقدمة');
        this.recordSyncActivity('بدء المزامنة التلقائية المتقدمة', 'success');
    }

    // إيقاف المزامنة التلقائية
    stopAdvancedAutoSync() {
        if (this.autoSyncInterval) {
            clearInterval(this.autoSyncInterval);
            this.autoSyncInterval = null;
        }
        
        if (this.fullSyncInterval) {
            clearInterval(this.fullSyncInterval);
            this.fullSyncInterval = null;
        }
        
        if (this.autoBackupInterval) {
            clearInterval(this.autoBackupInterval);
            this.autoBackupInterval = null;
        }

        console.log('تم إيقاف المزامنة التلقائية');
    }

    // إنشاء نسخة احتياطية تلقائية
    async createAutoBackup() {
        if (!this.isConnected || !window.dataManager) return;

        try {
            console.log('إنشاء نسخة احتياطية تلقائية...');
            
            const timestamp = new Date().toISOString();
            const backupData = {
                metadata: {
                    created: timestamp,
                    version: '4.0',
                    type: 'automatic',
                    size: 0
                },
                data: {
                    cases: window.dataManager.casesData || [],
                    defendants: window.dataManager.defendantsData || [],
                    lawyers: window.dataManager.lawyersData || [],
                    deductions: window.dataManager.deductionsData || [],
                    notifications: window.dataManager.notificationsData || [],
                    settings: window.dataManager.settingsData || {}
                }
            };

            backupData.metadata.size = JSON.stringify(backupData).length;
            
            const backupPath = `backups/automatic/${timestamp.replace(/[:.]/g, '_')}`;
            await this.db.ref(backupPath).set(backupData);
            
            await this.db.ref('backups/metadata/lastAutoBackup').set({
                timestamp,
                path: backupPath,
                size: backupData.metadata.size
            });

            await this.cleanupOldBackups();
            
            console.log('تم إنشاء النسخة الاحتياطية التلقائية بنجاح');
            this.recordSyncActivity(`تم إنشاء نسخة احتياطية تلقائية (${this.formatBytes(backupData.metadata.size)})`, 'success');
            
        } catch (error) {
            console.error('خطأ في إنشاء النسخة الاحتياطية:', error);
            this.recordSyncActivity(`خطأ في النسخة الاحتياطية: ${error.message}`, 'error');
        }
    }

    // تنظيف النسخ القديمة
    async cleanupOldBackups() {
        try {
            const backupsRef = this.db.ref('backups/automatic');
            const snapshot = await backupsRef.once('value');
            
            if (snapshot.exists()) {
                const backups = snapshot.val();
                const backupKeys = Object.keys(backups);
                
                backupKeys.sort((a, b) => new Date(b) - new Date(a));
                
                if (backupKeys.length > 10) {
                    const oldBackups = backupKeys.slice(10);
                    const deletePromises = oldBackups.map(key => backupsRef.child(key).remove());
                    await Promise.all(deletePromises);
                    
                    console.log(`تم حذف ${oldBackups.length} نسخة احتياطية قديمة`);
                    this.recordSyncActivity(`تنظيف ${oldBackups.length} نسخة قديمة`, 'info');
                }
            }
        } catch (error) {
            console.error('خطأ في تنظيف النسخ القديمة:', error);
        }
    }

    // تنسيق حجم البايتات
    formatBytes(bytes) {
        if (bytes === 0) return '0 بايت';
        const k = 1024;
        const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // تحديث حالة الاتصال
    updateConnectionStatus(status, text) {
        this.connectionStatus = status;
        const connectionBtn = document.getElementById('firebase-connection-btn');
        const statusText = document.getElementById('firebase-status');
        
        if (connectionBtn && statusText) {
            connectionBtn.classList.remove('disconnected', 'connecting', 'connected', 'syncing');
            connectionBtn.classList.add(status);
            statusText.textContent = text;
        }
    }

    // تحديث الواجهات
    refreshAllUI() {
        try {
            const uiFunctions = [
                'renderCasesTable',
                'renderDefendantsTable', 
                'renderLawyersTable',
                'renderDeductionsTable',
                'updateDashboardStats',
                'renderUpcomingHearings',
                'renderAlerts',
                'updateLawyerSelector'
            ];

            uiFunctions.forEach(funcName => {
                if (typeof window[funcName] === 'function') {
                    try {
                        window[funcName]();
                    } catch (error) {
                        console.warn(`خطأ في تشغيل ${funcName}:`, error);
                    }
                }
            });

            console.log('تم تحديث جميع الواجهات');
        } catch (error) {
            console.error('خطأ في تحديث الواجهات:', error);
        }
    }

    // فصل الاتصال المتقدم
    async disconnect() {
        try {
            console.log('قطع الاتصال المتقدم...');
            
            this.isConnected = false;
            this.stopAdvancedAutoSync();
            this.detachAllEventListeners();
            
            if (this.syncQueue.length > 0 || this.pendingChanges.size > 0) {
                this.showFirebaseNotification('تنبيه', `يوجد ${this.syncQueue.length} تغييرات لم تتم مزامنتها`, 'warning');
            }
            
            if (this.db) {
                await this.db.ref('system/status/lastDisconnect').set({
                    timestamp: new Date().toISOString(),
                    pendingChanges: this.syncQueue.length,
                    reason: 'manual_disconnect'
                });
            }
            
            this.updateConnectionStatus('disconnected', 'منقطع');
            this.recordSyncActivity('تم قطع الاتصال يدوياً', 'info');
            this.showFirebaseNotification('تم قطع الاتصال', 'تم قطع الاتصال مع Firebase', 'info');
            
        } catch (error) {
            console.error('خطأ في قطع الاتصال:', error);
            this.updateConnectionStatus('disconnected', 'خطأ في القطع');
        }
    }

    // فصل جميع مستمعي الأحداث
    detachAllEventListeners() {
        try {
            if (this.db) {
                Object.keys(this.realtimeListeners).forEach(path => {
                    if (this.realtimeListeners[path]) {
                        this.realtimeListeners[path].off();
                    }
                });
            }
            
            this.realtimeListeners = {};
            console.log('تم فصل جميع مستمعي الأحداث');
            
        } catch (error) {
            console.error('خطأ في فصل مستمعي الأحداث:', error);
        }
    }

    // تبديل الاتصال
    async toggleConnection() {
        if (this.isConnected) {
            await this.disconnect();
        } else {
            await this.connect();
        }
    }

    // مزامنة فورية شاملة
    async forceSyncAll() {
        if (!this.isConnected) {
            this.showFirebaseNotification('خطأ', 'لا يوجد اتصال بقاعدة البيانات', 'error');
            return;
        }

        this.showSyncProgressModal();
        
        try {
            console.log('بدء المزامنة الفورية الشاملة...');
            
            await this.syncAllDataAdvanced();
            await this.processQueue();
            await this.createAutoBackup();
            
            this.closeSyncProgressModal();
            this.showFirebaseNotification('مزامنة شاملة', 'تمت المزامنة الشاملة بنجاح', 'success');
            
        } catch (error) {
            console.error('خطأ في المزامنة الفورية:', error);
            this.closeSyncProgressModal();
            this.showFirebaseNotification('خطأ في المزامنة', error.message, 'error');
        }
    }

    // عرض حالة المزامنة
    showSyncStatus() {
        const stats = this.getSyncStatistics();
        
        const content = `
            <div style="text-align: center; padding: 2rem;">
                <h3 style="margin-bottom: 2rem; color: #1f2937;">حالة المزامنة المتقدمة</h3>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem; margin-bottom: 2rem;">
                    <div style="text-align: center; padding: 1.5rem; background: #f0f9ff; border-radius: 1rem;">
                        <div style="font-size: 2rem; font-weight: 800; color: #3b82f6; margin-bottom: 0.5rem;">${stats.activeSyncs}</div>
                        <div style="color: #6b7280;">عمليات نشطة</div>
                    </div>
                    
                    <div style="text-align: center; padding: 1.5rem; background: #f0fdf4; border-radius: 1rem;">
                        <div style="font-size: 2rem; font-weight: 800; color: #10b981; margin-bottom: 0.5rem;">${stats.lastSyncFormatted}</div>
                        <div style="color: #6b7280;">آخر مزامنة</div>
                    </div>
                    
                    <div style="text-align: center; padding: 1.5rem; background: #fefce8; border-radius: 1rem;">
                        <div style="font-size: 2rem; font-weight: 800; color: #eab308; margin-bottom: 0.5rem;">${stats.totalDataSize}</div>
                        <div style="color: #6b7280;">حجم البيانات</div>
                    </div>
                </div>
                
                <div style="background: #f9fafb; border-radius: 1rem; padding: 1.5rem; text-align: right;">
                    <h4 style="margin-bottom: 1rem; color: #374151;">سجل النشاط الأخير</h4>
                    ${this.renderSyncActivityLog()}
                </div>
            </div>
        `;

        this.createAdvancedModal('حالة المزامنة', content, [
            { text: 'مزامنة فورية', class: 'btn-primary', action: 'advancedFirebaseManager.forceSyncAll(); advancedFirebaseManager.closeModal(this);' },
            { text: 'إغلاق', class: 'btn-secondary', action: 'advancedFirebaseManager.closeModal(this);' }
        ]);
    }

    // الحصول على إحصائيات المزامنة
    getSyncStatistics() {
        const now = new Date();
        const lastSync = this.lastSyncTime ? new Date(this.lastSyncTime) : null;
        
        return {
            activeSyncs: this.syncQueue.length + this.pendingChanges.size,
            lastSyncFormatted: lastSync ? lastSync.toLocaleTimeString('ar-SA') : 'لم تتم بعد',
            timeSinceLastSync: lastSync ? this.getTimeDifference(lastSync, now) : 'غير معروف',
            totalDataSize: this.formatBytes(this.calculateTotalDataSize())
        };
    }

    // حساب حجم البيانات الإجمالي
    calculateTotalDataSize() {
        if (!window.dataManager) return 0;
        
        try {
            const allData = {
                cases: window.dataManager.casesData || [],
                defendants: window.dataManager.defendantsData || [],
                lawyers: window.dataManager.lawyersData || [],
                deductions: window.dataManager.deductionsData || [],
                notifications: window.dataManager.notificationsData || [],
                settings: window.dataManager.settingsData || {}
            };
            
            return JSON.stringify(allData).length;
        } catch (error) {
            console.error('خطأ في حساب حجم البيانات:', error);
            return 0;
        }
    }

    // حساب الفرق الزمني
    getTimeDifference(date1, date2) {
        const diff = Math.abs(date2 - date1);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days} يوم`;
        if (hours > 0) return `${hours} ساعة`;
        if (minutes > 0) return `${minutes} دقيقة`;
        return 'الآن';
    }

    // عرض سجل النشاط
    renderSyncActivityLog() {
        if (!this.syncActivities || this.syncActivities.length === 0) {
            return '<p style="text-align: center; color: #6b7280; padding: 2rem;">لا يوجد نشاط مسجل</p>';
        }

        return this.syncActivities.slice(0, 5).map(activity => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: white; border-radius: 0.5rem; margin-bottom: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <i class="fas fa-${activity.type === 'success' ? 'check-circle' : activity.type === 'error' ? 'exclamation-circle' : 'info-circle'}" style="color: ${activity.type === 'success' ? '#10b981' : activity.type === 'error' ? '#ef4444' : '#3b82f6'};"></i>
                    <span style="color: #374151;">${activity.message}</span>
                </div>
                <span style="color: #6b7280; font-size: 0.875rem;">${new Date(activity.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        `).join('');
    }

    // عرض مودال تقدم المزامنة
    showSyncProgressModal() {
        const content = `
            <div style="text-align: center; padding: 2rem;">
                <div style="font-size: 4rem; color: #3b82f6; margin-bottom: 1.5rem;">
                    <i class="fas fa-sync-alt fa-spin"></i>
                </div>
                <h3 style="margin-bottom: 1rem; color: #1f2937;">مزامنة شاملة جاري تنفيذها</h3>
                <p style="color: #6b7280; margin-bottom: 2rem;">جاري مزامنة جميع البيانات مع قاعدة البيانات...</p>
            </div>
        `;

        this.syncProgressModal = this.createAdvancedModal('مزامنة شاملة', content);
    }

    // إغلاق مودال تقدم المزامنة
    closeSyncProgressModal() {
        if (this.syncProgressModal) {
            this.closeModal(this.syncProgressModal.querySelector('button'));
            this.syncProgressModal = null;
        }
    }

    // عرض مودال الاتصال المتقدم
    showAdvancedConnectionModal() {
        const content = `
            <div style="text-align: center;">
                <div style="display: flex; justify-content: center; align-items: center; gap: 1rem; margin-bottom: 2rem;">
                    <div style="position: relative;">
                        <i class="fab fa-google" style="font-size: 4rem; color: #10b981;"></i>
                        <div style="position: absolute; top: -10px; right: -10px; width: 30px; height: 30px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                            <i class="fas fa-check" style="color: white; font-size: 1rem;"></i>
                        </div>
                    </div>
                    <i class="fas fa-link" style="font-size: 2rem; color: #3b82f6; animation: pulse 2s infinite;"></i>
                    <div style="position: relative;">
                        <i class="fas fa-database" style="font-size: 4rem; color: #10b981;"></i>
                        <div style="position: absolute; top: -5px; right: -5px; width: 20px; height: 20px; background: #10b981; border-radius: 50%; animation: heartbeat 2s infinite;"></div>
                    </div>
                </div>
                
                <h2 style="color: #10b981; margin-bottom: 1rem; font-size: 2rem;">اتصال متقدم ناجح!</h2>
                <p style="color: #6b7280; margin-bottom: 2rem; font-size: 1.125rem;">تم ربط النظام بقاعدة البيانات المتقدمة بنجاح</p>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 2rem 0;">
                    <div style="text-align: center; padding: 1rem; background: #f0f9ff; border-radius: 0.75rem;">
                        <i class="fas fa-sync-alt" style="font-size: 1.5rem; color: #3b82f6; margin-bottom: 0.5rem;"></i>
                        <div style="font-weight: 700; color: #1e40af;">مزامنة في الوقت الفعلي</div>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: #f0fdf4; border-radius: 0.75rem;">
                        <i class="fas fa-shield-alt" style="font-size: 1.5rem; color: #10b981; margin-bottom: 0.5rem;"></i>
                        <div style="font-weight: 700; color: #166534;">نسخ احتياطية تلقائية</div>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: #fefce8; border-radius: 0.75rem;">
                        <i class="fas fa-chart-line" style="font-size: 1.5rem; color: #eab308; margin-bottom: 0.5rem;"></i>
                        <div style="font-weight: 700; color: #a16207;">تحليلات متقدمة</div>
                    </div>
                </div>
            </div>
        `;

        const actions = [
            { text: 'مزامنة فورية', class: 'btn-primary', action: 'advancedFirebaseManager.forceSyncAll(); advancedFirebaseManager.closeModal(this);' },
            { text: 'عرض الحالة', class: 'btn-secondary', action: 'advancedFirebaseManager.showSyncStatus(); advancedFirebaseManager.closeModal(this);' },
            { text: 'ممتاز', class: 'btn-success', action: 'advancedFirebaseManager.closeModal(this);' }
        ];

        this.createAdvancedModal('Firebase - اتصال متقدم', content, actions);
    }

    // إنشاء مودال متقدم
    createAdvancedModal(title, content, actions = []) {
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay firebase-modal-overlay';
        modalOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(8px);
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        `;

        const actionsHtml = actions.length > 0 ? `
            <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 2rem;">
                ${actions.map(action => `
                    <button class="btn ${action.class}" onclick="${action.action}" style="position: relative; overflow: hidden;">
                        ${action.text}
                    </button>
                `).join('')}
            </div>
        ` : '';

        modalOverlay.innerHTML = `
            <div class="modal firebase-advanced-modal" style="
                background: linear-gradient(135deg, #ffffff, #f8fafc);
                border-radius: 1.5rem;
                padding: 2.5rem;
                max-width: 800px;
                width: 90%;
                max-height: 85vh;
                overflow-y: auto;
                position: relative;
                box-shadow: 0 25px 50px rgba(0,0,0,0.15);
                border: 1px solid rgba(255,255,255,0.2);
                transform: scale(0.9) translateY(20px);
                transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            ">
                <button class="modal-close" onclick="advancedFirebaseManager.closeModal(this)" style="
                    position: absolute;
                    top: 1.5rem;
                    right: 1.5rem;
                    background: rgba(239, 68, 68, 0.1);
                    border: none;
                    border-radius: 50%;
                    width: 3rem;
                    height: 3rem;
                    cursor: pointer;
                    color: #ef4444;
                    font-size: 1.25rem;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">
                    <i class="fas fa-times"></i>
                </button>
                
                <div style="margin-bottom: 2rem;">
                    <h3 style="font-size: 1.75rem; font-weight: 800; text-align: center; color: #1f2937; margin: 0;">${title}</h3>
                </div>
                
                <div class="modal-content">
                    ${content}
                </div>
                
                ${actionsHtml}
            </div>
        `;

        document.body.appendChild(modalOverlay);
        
        requestAnimationFrame(() => {
            modalOverlay.style.opacity = '1';
            const modal = modalOverlay.querySelector('.modal');
            modal.style.transform = 'scale(1) translateY(0)';
        });

        return modalOverlay;
    }

    // إغلاق المودال
    closeModal(button) {
        const modalOverlay = button.closest('.modal-overlay');
        if (modalOverlay) {
            modalOverlay.style.opacity = '0';
            const modal = modalOverlay.querySelector('.modal');
            modal.style.transform = 'scale(0.9) translateY(20px)';
            
            setTimeout(() => {
                if (document.body.contains(modalOverlay)) {
                    document.body.removeChild(modalOverlay);
                }
            }, 300);
        }
    }

    // عرض إشعار Firebase
    showFirebaseNotification(title, message, type = 'info') {
        if (typeof window.showNotification === 'function') {
            window.showNotification(title, message, type);
            return;
        }

        const container = document.getElementById('notification-container') || document.body;
        const notification = document.createElement('div');
        notification.className = `notification firebase-notification ${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-triangle',
            warning: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle'
        };
        
        notification.style.cssText = `
            position: fixed;
            top: 2rem;
            left: 2rem;
            max-width: 400px;
            z-index: 10001;
            transform: translateX(-100%);
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            padding: 1.5rem;
            border-radius: 1rem;
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
            background: white;
            border-left: 4px solid ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 1rem;">
                <div style="
                    width: 2.5rem;
                    height: 2.5rem;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1rem;
                    color: white;
                    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
                ">
                    <i class="${icons[type]}"></i>
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: 700; margin-bottom: 0.5rem; color: #1f2937; font-size: 1rem;">${title}</div>
                    <div style="color: #6b7280; font-size: 0.875rem; line-height: 1.4;">${message}</div>
                </div>
                <button onclick="this.parentNode.parentNode.style.transform='translateX(-100%)'" style="
                    background: none;
                    border: none;
                    color: #9ca3af;
                    cursor: pointer;
                    font-size: 1.25rem;
                    padding: 0.25rem;
                    transition: color 0.3s ease;
                ">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        container.appendChild(notification);
        
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
        });
        
        setTimeout(() => {
            notification.style.transform = 'translateX(-100%)';
            setTimeout(() => {
                if (container.contains(notification)) {
                    container.removeChild(notification);
                }
            }, 400);
        }, 5000);
    }

    // تنظيف الموارد
    cleanup() {
        try {
            console.log('تنظيف موارد Firebase المتقدم...');
            
            this.stopAdvancedAutoSync();
            this.detachAllEventListeners();
            
            if (this.dataObservers) {
                Object.values(this.dataObservers).forEach(observer => {
                    if (observer && typeof observer.disconnect === 'function') {
                        observer.disconnect();
                    } else if (typeof observer === 'number') {
                        clearInterval(observer);
                    }
                });
                this.dataObservers = {};
            }
            
            this.syncQueue = [];
            this.pendingChanges.clear();
            
            this.isConnected = false;
            this.connectionStatus = 'disconnected';
            
            if (this.syncActivities && this.syncActivities.length > 0) {
                localStorage.setItem('firebase_last_activities', JSON.stringify(this.syncActivities.slice(0, 20)));
            }
            
            console.log('تم تنظيف موارد Firebase بنجاح');
            
        } catch (error) {
            console.error('خطأ في تنظيف الموارد:', error);
        }
    }

    // تهيئة متغيرات البداية
    initialize() {
        this.startTime = Date.now();
        
        try {
            const savedActivities = localStorage.getItem('firebase_last_activities');
            if (savedActivities) {
                this.syncActivities = JSON.parse(savedActivities);
            }
        } catch (error) {
            console.warn('خطأ في تحميل الأنشطة المحفوظة:', error);
            this.syncActivities = [];
        }
        
        window.addEventListener('error', (event) => {
            this.recordSyncActivity(`خطأ في النظام: ${event.error?.message || 'خطأ غير معروف'}`, 'error');
        });
        
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
        
        console.log('تم تهيئة Firebase Manager المتقدم');
    }
}

// إنشاء مثيل Firebase Manager المتقدم
let advancedFirebaseManager;

// التهيئة عند تحميل الصفحة - إصدار محسن
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 بدء تهيئة Firebase Manager...');
    
    // إنشاء المدير أولاً
    try {
        advancedFirebaseManager = new AdvancedFirebaseManager();
        window.advancedFirebaseManager = advancedFirebaseManager;
        console.log('✅ تم إنشاء Firebase Manager');
    } catch (error) {
        console.error('❌ خطأ في إنشاء Firebase Manager:', error);
        return;
    }
    
    // التأكد من إضافة الواجهة
    function ensureUIExists() {
        const firebaseUI = document.getElementById('firebase-advanced-container');
        if (!firebaseUI) {
            console.log('🔧 الواجهة غير موجودة، جاري إنشاؤها...');
            advancedFirebaseManager.attemptUICreation();
            
            // فحص مرة أخرى بعد ثانية
            setTimeout(() => {
                const newFirebaseUI = document.getElementById('firebase-advanced-container');
                if (!newFirebaseUI) {
                    console.warn('⚠️ فشل في إنشاء الواجهة، محاولة الطريقة البديلة...');
                    advancedFirebaseManager.createFallbackUI();
                }
            }, 1000);
        } else {
            console.log('✅ Firebase UI موجودة بالفعل');
        }
    }
    
    // محاولة إنشاء الواجهة فوراً
    ensureUIExists();
    
    // ومحاولة أخرى بعد ثانيتين للتأكد
    setTimeout(ensureUIExists, 2000);
    
    // تهيئة المدير
    try {
        advancedFirebaseManager.initialize();
        console.log('✅ تم تهيئة Firebase Manager المتقدم v4.0 بنجاح');
    } catch (error) {
        console.error('❌ خطأ في تهيئة Firebase Manager:', error);
    }
    
    // إضافة زر يدوي إذا فشل كل شيء
    setTimeout(() => {
        if (!document.getElementById('firebase-advanced-container')) {
            console.log('🆘 إضافة زر Firebase يدوياً...');
            createManualFirebaseButton();
        }
    }, 5000);
});

// دالة لإضافة زر Firebase يدوياً
function createManualFirebaseButton() {
    const manualButton = document.createElement('div');
    manualButton.id = 'firebase-manual-button';
    manualButton.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 10000;
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
        padding: 12px 16px;
        border-radius: 12px;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
        font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
        font-weight: 600;
        font-size: 14px;
        transition: all 0.3s ease;
        user-select: none;
        display: flex;
        align-items: center;
        gap: 8px;
    `;
    
    manualButton.innerHTML = `
        <i class="fab fa-google" style="font-size: 16px;"></i>
        <span>Firebase</span>
        <div style="width: 8px; height: 8px; background: #ef4444; border-radius: 50%; margin-left: 4px;" id="manual-indicator"></div>
    `;
    
    manualButton.addEventListener('click', function() {
        if (window.advancedFirebaseManager) {
            window.advancedFirebaseManager.toggleConnection();
        } else {
            alert('Firebase Manager غير متاح');
        }
    });
    
    manualButton.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.05)';
        this.style.boxShadow = '0 6px 25px rgba(59, 130, 246, 0.4)';
    });
    
    manualButton.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
        this.style.boxShadow = '0 4px 20px rgba(59, 130, 246, 0.3)';
    });
    
    document.body.appendChild(manualButton);
    console.log('✅ تم إنشاء زر Firebase اليدوي');
}

// تصدير للاستخدام في وحدات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedFirebaseManager;
}

// جعل الفئة متاحة عالمياً
window.AdvancedFirebaseManager = AdvancedFirebaseManager;

// نهاية الكود - التأكد من إغلاق جميع الأقواس
console.log('Firebase Integration v4.0 - تم تحميل الملف كاملاً');