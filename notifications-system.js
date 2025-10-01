/**
 * نظام الإشعارات المتقدم المتكامل مع Firebase
 * Advanced Notifications System with Firebase Integration
 * النسخة المحدثة v2.0 - دعم كامل لـ Firebase
 */

(function() {
    'use strict';

    // ==================== الإعدادات الأساسية ====================
    
    // تحميل الإعدادات المحفوظة أو استخدام القيم الافتراضية
    const loadSavedConfig = () => {
        const saved = localStorage.getItem('notification_config');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return {
                    CHECK_INTERVAL: parsed.CHECK_INTERVAL || 60000,
                    SOUND_ENABLED: parsed.SOUND_ENABLED !== undefined ? parsed.SOUND_ENABLED : true,
                    DESKTOP_NOTIFICATIONS: parsed.DESKTOP_NOTIFICATIONS !== undefined ? parsed.DESKTOP_NOTIFICATIONS : false,
                    AUTO_DISMISS: parsed.AUTO_DISMISS || 10000,
                    MAX_NOTIFICATIONS: parsed.MAX_NOTIFICATIONS || 50,
                    HEARING_WARNING_DAYS: parsed.HEARING_WARNING_DAYS || [7, 3, 1],
                    DEDUCTION_OVERDUE_DAYS: parsed.DEDUCTION_OVERDUE_DAYS || 30,
                    FIREBASE_SYNC: parsed.FIREBASE_SYNC !== undefined ? parsed.FIREBASE_SYNC : true,
                    FIREBASE_REALTIME: parsed.FIREBASE_REALTIME !== undefined ? parsed.FIREBASE_REALTIME : true,
                    PRIORITIES: {
                        CRITICAL: 'critical',
                        HIGH: 'high',
                        MEDIUM: 'medium',
                        LOW: 'low'
                    },
                    TYPES: {
                        HEARING: 'hearing',
                        CASE: 'case',
                        DEDUCTION: 'deduction',
                        DEFENDANT: 'defendant',
                        LAWYER: 'lawyer',
                        SYSTEM: 'system',
                        FIREBASE: 'firebase'
                    }
                };
            } catch (e) {
                console.warn('فشل تحميل الإعدادات المحفوظة:', e);
            }
        }
        
        // القيم الافتراضية
        return {
            CHECK_INTERVAL: 60000,
            SOUND_ENABLED: true,
            DESKTOP_NOTIFICATIONS: false,
            AUTO_DISMISS: 10000,
            MAX_NOTIFICATIONS: 50,
            HEARING_WARNING_DAYS: [7, 3, 1],
            DEDUCTION_OVERDUE_DAYS: 30,
            FIREBASE_SYNC: true,
            FIREBASE_REALTIME: true,
            PRIORITIES: {
                CRITICAL: 'critical',
                HIGH: 'high',
                MEDIUM: 'medium',
                LOW: 'low'
            },
            TYPES: {
                HEARING: 'hearing',
                CASE: 'case',
                DEDUCTION: 'deduction',
                DEFENDANT: 'defendant',
                LAWYER: 'lawyer',
                SYSTEM: 'system',
                FIREBASE: 'firebase'
            }
        };
    };

    const NotificationConfig = loadSavedConfig();

    // ==================== نظام الأصوات ====================
    class NotificationSound {
        constructor() {
            this.sounds = {
                critical: this.createBeep(800, 0.3, 'square'),
                high: this.createBeep(600, 0.2, 'sine'),
                medium: this.createBeep(400, 0.15, 'sine'),
                low: this.createBeep(300, 0.1, 'sine'),
                success: this.createMelody([523, 659, 784], 0.15),
                warning: this.createMelody([400, 500], 0.2),
                error: this.createMelody([300, 250, 200], 0.25)
            };
        }

        createBeep(frequency, duration, type = 'sine') {
            return () => {
                if (!NotificationConfig.SOUND_ENABLED) return;
                
                try {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();

                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);

                    oscillator.frequency.value = frequency;
                    oscillator.type = type;

                    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + duration);
                } catch (e) {
                    console.warn('فشل تشغيل الصوت:', e);
                }
            };
        }

        createMelody(frequencies, duration) {
            return () => {
                if (!NotificationConfig.SOUND_ENABLED) return;
                
                frequencies.forEach((freq, index) => {
                    setTimeout(() => {
                        this.createBeep(freq, duration)();
                    }, index * (duration * 1000));
                });
            };
        }

        play(type) {
            if (this.sounds[type]) {
                this.sounds[type]();
            }
        }
    }

    // ==================== مدير الإشعارات الرئيسي مع Firebase ====================
    class NotificationManager {
        constructor() {
            this.notifications = [];
            this.filters = {
                type: 'all',
                priority: 'all',
                read: 'all'
            };
            this.soundManager = new NotificationSound();
            this.checkTimer = null;
            this.lastChecked = {};
            this.firebaseConnected = false;
            this.firebaseListener = null;
            this.pendingFirebaseSync = [];
            this.syncInProgress = false;
            
            this.init();
        }

        init() {
            this.loadNotifications();
            this.injectStyles();
            this.enhanceNotificationUI();
            this.startPeriodicChecks();
            this.waitForFirebaseAndConnect();
            
            console.log('✅ تم تهيئة نظام الإشعارات المتقدم مع دعم Firebase');
        }

        // ==================== تكامل Firebase ====================
        
        // انتظار Firebase والاتصال
        waitForFirebaseAndConnect() {
            const checkFirebase = () => {
                if (window.advancedFirebaseManager) {
                    this.setupFirebaseIntegration();
                } else {
                    setTimeout(checkFirebase, 500);
                }
            };
            checkFirebase();
        }

        // إعداد التكامل مع Firebase
        setupFirebaseIntegration() {
            console.log('🔥 إعداد تكامل الإشعارات مع Firebase...');
            
            // مراقبة حالة اتصال Firebase
            this.monitorFirebaseConnection();
            
            // إعداد المزامنة التلقائية
            if (NotificationConfig.FIREBASE_SYNC) {
                this.setupAutoFirebaseSync();
            }
            
            // إعداد المستمعات للتحديثات الفورية
            if (NotificationConfig.FIREBASE_REALTIME) {
                this.setupFirebaseRealtimeListeners();
            }
        }

        // مراقبة حالة اتصال Firebase
        monitorFirebaseConnection() {
            const checkConnection = () => {
                const wasConnected = this.firebaseConnected;
                this.firebaseConnected = window.advancedFirebaseManager?.isConnected || false;
                
                if (this.firebaseConnected && !wasConnected) {
                    console.log('✅ Firebase متصل - بدء مزامنة الإشعارات');
                    this.onFirebaseConnected();
                } else if (!this.firebaseConnected && wasConnected) {
                    console.log('⚠️ Firebase منقطع - إيقاف المزامنة');
                    this.onFirebaseDisconnected();
                }
            };
            
            setInterval(checkConnection, 2000);
            checkConnection();
        }

        // عند اتصال Firebase
        async onFirebaseConnected() {
            try {
                // مزامنة الإشعارات المحلية مع Firebase
                await this.syncNotificationsToFirebase();
                
                // تحميل الإشعارات من Firebase
                await this.loadNotificationsFromFirebase();
                
                // معالجة الإشعارات المعلقة
                if (this.pendingFirebaseSync.length > 0) {
                    await this.processPendingFirebaseSyncs();
                }
                
                this.createNotification({
                    type: NotificationConfig.TYPES.FIREBASE,
                    priority: NotificationConfig.PRIORITIES.LOW,
                    title: '🔥 Firebase متصل',
                    message: 'تم تفعيل المزامنة التلقائية للإشعارات',
                    skipFirebaseSync: true
                });
            } catch (error) {
                console.error('خطأ في الاتصال بـ Firebase:', error);
            }
        }

        // عند قطع اتصال Firebase
        onFirebaseDisconnected() {
            if (this.firebaseListener) {
                try {
                    this.firebaseListener.off();
                } catch (e) {
                    console.warn('خطأ في إيقاف المستمع:', e);
                }
                this.firebaseListener = null;
            }
        }

        // إعداد المستمعات للتحديثات الفورية من Firebase
        setupFirebaseRealtimeListeners() {
            if (!window.advancedFirebaseManager?.db) {
                setTimeout(() => this.setupFirebaseRealtimeListeners(), 1000);
                return;
            }

            try {
                const notificationsRef = window.advancedFirebaseManager.db.ref('notifications/system');
                
                this.firebaseListener = notificationsRef.on('child_added', (snapshot) => {
                    const notification = snapshot.val();
                    if (notification && !this.isDuplicateNotification(notification)) {
                        console.log('📩 إشعار جديد من Firebase:', notification.title);
                        this.handleFirebaseNotification(notification);
                    }
                });

                console.log('✅ تم إعداد المستمعات للتحديثات الفورية من Firebase');
            } catch (error) {
                console.error('خطأ في إعداد المستمعات:', error);
            }
        }

        // التحقق من الإشعارات المكررة
        isDuplicateNotification(firebaseNotification) {
            return this.notifications.some(n => 
                n.id === firebaseNotification.id || 
                (n.title === firebaseNotification.title && 
                 n.message === firebaseNotification.message &&
                 Math.abs(new Date(n.timestamp) - new Date(firebaseNotification.timestamp)) < 5000)
            );
        }

        // معالجة إشعار من Firebase
        handleFirebaseNotification(firebaseNotification) {
            const notification = {
                ...firebaseNotification,
                fromFirebase: true,
                skipFirebaseSync: true
            };

            this.notifications.unshift(notification);
            this.saveNotifications();
            this.updateBadge();
            
            this.playNotificationSound(notification.priority);
            this.showNotificationPopup(notification);
            
            if (NotificationConfig.DESKTOP_NOTIFICATIONS) {
                this.showDesktopNotification(notification);
            }

            this.refreshNotificationsList();
        }

        // إعداد المزامنة التلقائية مع Firebase
        setupAutoFirebaseSync() {
            setInterval(() => {
                if (this.firebaseConnected && !this.syncInProgress) {
                    this.syncNotificationsToFirebase();
                }
            }, 30000); // كل 30 ثانية
        }

        // مزامنة الإشعارات إلى Firebase
        async syncNotificationsToFirebase() {
            if (!this.firebaseConnected || this.syncInProgress) return;

            try {
                this.syncInProgress = true;
                const db = window.advancedFirebaseManager?.db;
                if (!db) return;

                const notificationsToSync = this.notifications.filter(n => !n.fromFirebase);
                
                if (notificationsToSync.length === 0) {
                    return;
                }

                const updates = {};
                const timestamp = new Date().toISOString();

                notificationsToSync.forEach(notification => {
                    const key = `notification_${notification.id}`;
                    updates[`notifications/system/${key}`] = {
                        ...notification,
                        syncedAt: timestamp,
                        syncVersion: '2.0'
                    };
                });

                await db.ref().update(updates);
                console.log(`✅ تم مزامنة ${notificationsToSync.length} إشعار إلى Firebase`);

            } catch (error) {
                console.error('خطأ في مزامنة الإشعارات:', error);
                this.pendingFirebaseSync.push(...this.notifications.filter(n => !n.fromFirebase));
            } finally {
                this.syncInProgress = false;
            }
        }

        // تحميل الإشعارات من Firebase
        async loadNotificationsFromFirebase() {
            if (!this.firebaseConnected) return;

            try {
                const db = window.advancedFirebaseManager?.db;
                if (!db) return;

                const snapshot = await db.ref('notifications/system').once('value');
                
                if (snapshot.exists()) {
                    const firebaseNotifications = [];
                    snapshot.forEach(childSnapshot => {
                        const notification = childSnapshot.val();
                        if (notification && !this.isDuplicateNotification(notification)) {
                            firebaseNotifications.push({
                                ...notification,
                                fromFirebase: true
                            });
                        }
                    });

                    if (firebaseNotifications.length > 0) {
                        this.notifications = [...firebaseNotifications, ...this.notifications];
                        this.notifications = this.notifications.slice(0, NotificationConfig.MAX_NOTIFICATIONS);
                        this.saveNotifications();
                        this.updateBadge();
                        this.refreshNotificationsList();
                        
                        console.log(`✅ تم تحميل ${firebaseNotifications.length} إشعار من Firebase`);
                    }
                }
            } catch (error) {
                console.error('خطأ في تحميل الإشعارات من Firebase:', error);
            }
        }

        // معالجة الإشعارات المعلقة
        async processPendingFirebaseSyncs() {
            if (this.pendingFirebaseSync.length === 0) return;

            try {
                const db = window.advancedFirebaseManager?.db;
                if (!db) return;

                const updates = {};
                const timestamp = new Date().toISOString();

                this.pendingFirebaseSync.forEach(notification => {
                    const key = `notification_${notification.id}`;
                    updates[`notifications/system/${key}`] = {
                        ...notification,
                        syncedAt: timestamp,
                        syncVersion: '2.0'
                    };
                });

                await db.ref().update(updates);
                console.log(`✅ تم مزامنة ${this.pendingFirebaseSync.length} إشعار معلق`);
                
                this.pendingFirebaseSync = [];
            } catch (error) {
                console.error('خطأ في معالجة الإشعارات المعلقة:', error);
            }
        }

        // حذف إشعار من Firebase
        async deleteNotificationFromFirebase(notificationId) {
            if (!this.firebaseConnected) return;

            try {
                const db = window.advancedFirebaseManager?.db;
                if (!db) return;

                const key = `notification_${notificationId}`;
                await db.ref(`notifications/system/${key}`).remove();
                console.log(`✅ تم حذف الإشعار ${notificationId} من Firebase`);
            } catch (error) {
                console.error('خطأ في حذف الإشعار من Firebase:', error);
            }
        }

        // تحديث حالة الإشعار في Firebase
        async updateNotificationInFirebase(notificationId, updates) {
            if (!this.firebaseConnected) return;

            try {
                const db = window.advancedFirebaseManager?.db;
                if (!db) return;

                const key = `notification_${notificationId}`;
                await db.ref(`notifications/system/${key}`).update({
                    ...updates,
                    lastUpdated: new Date().toISOString()
                });
            } catch (error) {
                console.error('خطأ في تحديث الإشعار في Firebase:', error);
            }
        }

        // ==================== الوظائف الأساسية ====================

        loadNotifications() {
            const saved = localStorage.getItem('advanced_notifications');
            if (saved) {
                try {
                    this.notifications = JSON.parse(saved);
                } catch (e) {
                    console.error('خطأ في تحميل الإشعارات:', e);
                    this.notifications = [];
                }
            }
        }

        saveNotifications() {
            const toSave = this.notifications.slice(0, NotificationConfig.MAX_NOTIFICATIONS);
            localStorage.setItem('advanced_notifications', JSON.stringify(toSave));
        }

        createNotification(data) {
            const notification = {
                id: Date.now() + Math.random(),
                type: data.type || NotificationConfig.TYPES.SYSTEM,
                priority: data.priority || NotificationConfig.PRIORITIES.MEDIUM,
                title: data.title,
                message: data.message,
                icon: data.icon || this.getIconForType(data.type),
                timestamp: new Date().toISOString(),
                read: false,
                dismissed: false,
                actionUrl: data.actionUrl,
                actionText: data.actionText,
                relatedId: data.relatedId,
                metadata: data.metadata || {},
                skipFirebaseSync: data.skipFirebaseSync || false
            };

            this.notifications.unshift(notification);
            this.saveNotifications();
            this.updateBadge();
            
            this.playNotificationSound(notification.priority);
            this.showNotificationPopup(notification);
            
            if (NotificationConfig.DESKTOP_NOTIFICATIONS) {
                this.showDesktopNotification(notification);
            }

            // مزامنة مع Firebase إذا كان متصلاً
            if (this.firebaseConnected && !notification.skipFirebaseSync) {
                this.syncSingleNotificationToFirebase(notification);
            } else if (!notification.skipFirebaseSync) {
                this.pendingFirebaseSync.push(notification);
            }

            return notification;
        }

        // مزامنة إشعار واحد مع Firebase
        async syncSingleNotificationToFirebase(notification) {
            try {
                const db = window.advancedFirebaseManager?.db;
                if (!db) return;

                const key = `notification_${notification.id}`;
                await db.ref(`notifications/system/${key}`).set({
                    ...notification,
                    syncedAt: new Date().toISOString(),
                    syncVersion: '2.0'
                });
            } catch (error) {
                console.error('خطأ في مزامنة الإشعار:', error);
                this.pendingFirebaseSync.push(notification);
            }
        }

        getIconForType(type) {
            const icons = {
                [NotificationConfig.TYPES.HEARING]: 'fa-gavel',
                [NotificationConfig.TYPES.CASE]: 'fa-file-contract',
                [NotificationConfig.TYPES.DEDUCTION]: 'fa-coins',
                [NotificationConfig.TYPES.DEFENDANT]: 'fa-user-tie',
                [NotificationConfig.TYPES.LAWYER]: 'fa-balance-scale',
                [NotificationConfig.TYPES.SYSTEM]: 'fa-info-circle',
                [NotificationConfig.TYPES.FIREBASE]: 'fa-cloud'
            };
            return icons[type] || 'fa-bell';
        }

        playNotificationSound(priority) {
            const soundMap = {
                [NotificationConfig.PRIORITIES.CRITICAL]: 'critical',
                [NotificationConfig.PRIORITIES.HIGH]: 'high',
                [NotificationConfig.PRIORITIES.MEDIUM]: 'medium',
                [NotificationConfig.PRIORITIES.LOW]: 'low'
            };
            
            this.soundManager.play(soundMap[priority] || 'medium');
        }

        startPeriodicChecks() {
            this.performChecks();
            
            this.checkTimer = setInterval(() => {
                this.performChecks();
            }, NotificationConfig.CHECK_INTERVAL);
        }

        performChecks() {
            if (!window.dataManager) return;

            this.checkUpcomingHearings();
            this.checkOverdueCases();
            this.checkPendingDeductions();
        }

        checkUpcomingHearings() {
            const cases = window.dataManager.casesData || [];
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            cases.forEach(caseItem => {
                if (!caseItem.nextHearing) return;

                const hearingDate = new Date(caseItem.nextHearing);
                hearingDate.setHours(0, 0, 0, 0);
                
                const daysUntil = Math.ceil((hearingDate - today) / (1000 * 60 * 60 * 24));

                NotificationConfig.HEARING_WARNING_DAYS.forEach(days => {
                    const checkKey = `hearing_${caseItem.id}_${days}`;
                    
                    if (daysUntil === days && !this.lastChecked[checkKey]) {
                        let priority, message;
                        
                        if (days === 1) {
                            priority = NotificationConfig.PRIORITIES.CRITICAL;
                            message = `⚠️ جلسة غداً! القضية: ${caseItem.caseNumber}`;
                        } else if (days === 3) {
                            priority = NotificationConfig.PRIORITIES.HIGH;
                            message = `تذكير: جلسة بعد ${days} أيام - القضية: ${caseItem.caseNumber}`;
                        } else {
                            priority = NotificationConfig.PRIORITIES.MEDIUM;
                            message = `جلسة قادمة بعد ${days} أيام - القضية: ${caseItem.caseNumber}`;
                        }

                        this.createNotification({
                            type: NotificationConfig.TYPES.HEARING,
                            priority: priority,
                            title: 'تنبيه جلسة قضائية',
                            message: message,
                            actionText: 'عرض التفاصيل',
                            actionUrl: () => {
                                if (window.showCaseDetails) {
                                    window.showCaseDetails(caseItem.id);
                                }
                            },
                            relatedId: caseItem.id,
                            metadata: {
                                caseNumber: caseItem.caseNumber,
                                hearingDate: caseItem.nextHearing,
                                daysUntil: daysUntil
                            }
                        });

                        this.lastChecked[checkKey] = Date.now();
                    }
                });

                if (daysUntil < 0) {
                    const checkKey = `hearing_missed_${caseItem.id}`;
                    const daysSince = Math.abs(daysUntil);
                    
                    if (daysSince <= 7 && !this.lastChecked[checkKey]) {
                        this.createNotification({
                            type: NotificationConfig.TYPES.HEARING,
                            priority: NotificationConfig.PRIORITIES.HIGH,
                            title: '⚠️ جلسة فائتة',
                            message: `الجلسة المقررة لـ ${caseItem.caseNumber} كانت منذ ${daysSince} يوم. يرجى تحديث حالة القضية.`,
                            actionText: 'تحديث القضية',
                            actionUrl: () => {
                                if (window.showCaseDetails) {
                                    window.showCaseDetails(caseItem.id);
                                }
                            },
                            relatedId: caseItem.id
                        });

                        this.lastChecked[checkKey] = Date.now();
                    }
                }
            });
        }

        checkOverdueCases() {
            const cases = window.dataManager.casesData || [];
            const today = new Date();

            cases.forEach(caseItem => {
                const lastUpdate = new Date(caseItem.lastUpdate);
                const daysSinceUpdate = Math.ceil((today - lastUpdate) / (1000 * 60 * 60 * 24));

                if (daysSinceUpdate >= 30 && caseItem.status !== 'مغلقة' && caseItem.status !== 'تنفيذ') {
                    const checkKey = `case_overdue_${caseItem.id}_${Math.floor(daysSinceUpdate / 30)}`;
                    
                    if (!this.lastChecked[checkKey]) {
                        this.createNotification({
                            type: NotificationConfig.TYPES.CASE,
                            priority: NotificationConfig.PRIORITIES.MEDIUM,
                            title: '📋 تحديث مطلوب',
                            message: `القضية ${caseItem.caseNumber} لم يتم تحديثها منذ ${daysSinceUpdate} يوم`,
                            actionText: 'عرض القضية',
                            actionUrl: () => {
                                if (window.showCaseDetails) {
                                    window.showCaseDetails(caseItem.id);
                                }
                            },
                            relatedId: caseItem.id
                        });

                        this.lastChecked[checkKey] = Date.now();
                    }
                }
            });
        }

        checkPendingDeductions() {
            const cases = window.dataManager.casesData || [];

            cases.forEach(caseItem => {
                const remaining = caseItem.amount - (caseItem.deductions || 0);
                
                if (remaining > 0 && caseItem.status === 'تنفيذ') {
                    const checkKey = `deduction_pending_${caseItem.id}`;
                    const lastCheck = this.lastChecked[checkKey] || 0;
                    const daysSinceCheck = (Date.now() - lastCheck) / (1000 * 60 * 60 * 24);

                    if (daysSinceCheck >= 14) {
                        this.createNotification({
                            type: NotificationConfig.TYPES.DEDUCTION,
                            priority: NotificationConfig.PRIORITIES.MEDIUM,
                            title: '💰 استقطاع معلق',
                            message: `القضية ${caseItem.caseNumber} - المبلغ المتبقي: ${this.formatNumber(remaining)} د.ع`,
                            actionText: 'إضافة استقطاع',
                            actionUrl: () => {
                                if (window.showNewDeductionModal) {
                                    window.showNewDeductionModal();
                                }
                            },
                            relatedId: caseItem.id,
                            metadata: {
                                remainingAmount: remaining
                            }
                        });

                        this.lastChecked[checkKey] = Date.now();
                    }
                }
            });
        }

        showNotificationPopup(notification) {
            const popup = document.createElement('div');
            popup.className = `advanced-notification-popup priority-${notification.priority}`;
            popup.setAttribute('data-notification-id', notification.id);

            const priorityIcons = {
                [NotificationConfig.PRIORITIES.CRITICAL]: '🔴',
                [NotificationConfig.PRIORITIES.HIGH]: '🟠',
                [NotificationConfig.PRIORITIES.MEDIUM]: '🟡',
                [NotificationConfig.PRIORITIES.LOW]: '🟢'
            };

            popup.innerHTML = `
                <div class="notification-popup-content">
                    <div class="notification-popup-header">
                        <div class="notification-popup-icon">
                            <i class="fas ${notification.icon}"></i>
                        </div>
                        <div class="notification-popup-title">
                            ${priorityIcons[notification.priority] || ''} ${notification.title}
                            ${notification.fromFirebase ? '<span class="firebase-badge">🔥</span>' : ''}
                        </div>
                        <button class="notification-popup-close" data-dismiss-id="${notification.id}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="notification-popup-body">
                        ${notification.message}
                    </div>
                    ${notification.actionText ? `
                        <div class="notification-popup-actions">
                            <button class="notification-popup-action" data-action-id="${notification.id}">
                                ${notification.actionText}
                            </button>
                        </div>
                    ` : ''}
                </div>
                <div class="notification-popup-progress"></div>
            `;

            document.body.appendChild(popup);

            const closeBtn = popup.querySelector('.notification-popup-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.dismissPopup(notification.id));
            }

            const actionBtn = popup.querySelector('.notification-popup-action');
            if (actionBtn) {
                actionBtn.addEventListener('click', () => this.handleAction(notification.id));
            }

            setTimeout(() => popup.classList.add('show'), 10);

            if (NotificationConfig.AUTO_DISMISS) {
                setTimeout(() => {
                    this.dismissPopup(notification.id);
                }, NotificationConfig.AUTO_DISMISS);
            }
        }

        dismissPopup(id) {
            const popup = document.querySelector(`[data-notification-id="${id}"]`);
            if (popup) {
                popup.classList.remove('show');
                setTimeout(() => {
                    if (popup.parentNode) {
                        popup.parentNode.removeChild(popup);
                    }
                }, 300);
            }
        }

        handleAction(id) {
            const notification = this.notifications.find(n => n.id === id);
            if (notification && notification.actionUrl) {
                if (typeof notification.actionUrl === 'function') {
                    notification.actionUrl();
                } else {
                    window.location.href = notification.actionUrl;
                }
                this.markAsRead(id);
                this.dismissPopup(id);
            }
        }

        showDesktopNotification(notification) {
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(notification.title, {
                    body: notification.message,
                    icon: '/path/to/icon.png',
                    badge: '/path/to/badge.png'
                });
            }
        }

        markAsRead(id) {
            const notification = this.notifications.find(n => n.id === id);
            if (notification) {
                notification.read = true;
                this.saveNotifications();
                this.updateBadge();
                this.refreshNotificationsList();
                
                // تحديث في Firebase
                if (this.firebaseConnected && !notification.skipFirebaseSync) {
                    this.updateNotificationInFirebase(id, { read: true });
                }
            }
        }

        markAllAsRead() {
            this.notifications.forEach(n => n.read = true);
            this.saveNotifications();
            this.updateBadge();
            this.refreshNotificationsList();
            
            // تحديث في Firebase
            if (this.firebaseConnected) {
                this.syncNotificationsToFirebase();
            }
        }

        deleteNotification(id) {
            this.notifications = this.notifications.filter(n => n.id !== id);
            this.saveNotifications();
            this.updateBadge();
            this.refreshNotificationsList();
            
            // حذف من Firebase
            if (this.firebaseConnected) {
                this.deleteNotificationFromFirebase(id);
            }
        }

        clearAll() {
            if (confirm('هل أنت متأكد من حذف جميع الإشعارات؟')) {
                // حذف من Firebase أولاً
                if (this.firebaseConnected) {
                    const db = window.advancedFirebaseManager?.db;
                    if (db) {
                        db.ref('notifications/system').remove().catch(e => console.error(e));
                    }
                }
                
                this.notifications = [];
                this.saveNotifications();
                this.updateBadge();
                this.refreshNotificationsList();
            }
        }

        setFilter(filterType, value) {
            this.filters[filterType] = value;
            this.refreshNotificationsList();
        }

        getFilteredNotifications() {
            return this.notifications.filter(n => {
                if (this.filters.type !== 'all' && n.type !== this.filters.type) return false;
                if (this.filters.priority !== 'all' && n.priority !== this.filters.priority) return false;
                if (this.filters.read === 'unread' && n.read) return false;
                if (this.filters.read === 'read' && !n.read) return false;
                return true;
            });
        }

        enhanceNotificationUI() {
            const bellButton = document.querySelector('.notification-bell');
            if (bellButton) {
                bellButton.onclick = () => this.showNotificationsPanel();
            }
        }

        showNotificationsPanel() {
            const existingPanel = document.getElementById('advanced-notifications-panel');
            if (existingPanel) {
                this.closePanel();
                return;
            }

            const panel = document.createElement('div');
            panel.id = 'advanced-notifications-panel';
            panel.className = 'advanced-notifications-panel';

            panel.innerHTML = this.getNotificationsPanelHTML();
            document.body.appendChild(panel);

            setTimeout(() => panel.classList.add('show'), 10);

            this.setupPanelEventListeners(panel);
        }

        getNotificationsPanelHTML() {
            const filtered = this.getFilteredNotifications();
            const unreadCount = this.notifications.filter(n => !n.read).length;
            const firebaseStatus = this.firebaseConnected ? 
                '<span class="firebase-status connected">🔥 متصل</span>' : 
                '<span class="firebase-status disconnected">⚠️ غير متصل</span>';

            return `
                <div class="notifications-panel-header">
                    <h3>
                        <i class="fas fa-bell"></i>
                        الإشعارات
                        ${unreadCount > 0 ? `<span class="unread-badge">${unreadCount}</span>` : ''}
                    </h3>
                    ${firebaseStatus}
                    <button class="panel-close-btn" data-close-panel>
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="notifications-filters">
                    <select data-filter-type="type">
                        <option value="all">جميع الأنواع</option>
                        <option value="hearing">الجلسات</option>
                        <option value="case">الدعاوى</option>
                        <option value="deduction">الاستقطاعات</option>
                        <option value="defendant">المدعى عليهم</option>
                        <option value="lawyer">المحامون</option>
                        <option value="firebase">Firebase</option>
                        <option value="system">النظام</option>
                    </select>

                    <select data-filter-type="priority">
                        <option value="all">جميع الأولويات</option>
                        <option value="critical">حرجة</option>
                        <option value="high">عالية</option>
                        <option value="medium">متوسطة</option>
                        <option value="low">منخفضة</option>
                    </select>

                    <select data-filter-type="read">
                        <option value="all">الكل</option>
                        <option value="unread">غير مقروءة</option>
                        <option value="read">مقروءة</option>
                    </select>
                </div>

                <div class="notifications-actions">
                    <button class="action-btn" data-mark-all-read>
                        <i class="fas fa-check-double"></i>
                        تحديد الكل كمقروء
                    </button>
                    ${this.firebaseConnected ? `
                        <button class="action-btn firebase-sync-btn" data-sync-firebase>
                            <i class="fas fa-sync-alt"></i>
                            مزامنة Firebase
                        </button>
                    ` : ''}
                    <button class="action-btn" data-clear-all>
                        <i class="fas fa-trash"></i>
                        حذف الكل
                    </button>
                </div>

                <div class="notifications-list">
                    ${filtered.length === 0 ? 
                        '<div class="no-notifications"><i class="fas fa-inbox"></i><p>لا توجد إشعارات</p></div>' :
                        filtered.map(n => this.getNotificationItemHTML(n)).join('')
                    }
                </div>

                <div class="notifications-settings">
                    <button class="settings-btn" data-show-settings>
                        <i class="fas fa-cog"></i>
                        إعدادات الإشعارات
                    </button>
                </div>
            `;
        }

        getNotificationItemHTML(notification) {
            const timeAgo = this.getTimeAgo(notification.timestamp);
            const priorityClass = `priority-${notification.priority}`;
            const readClass = notification.read ? 'read' : 'unread';
            const firebaseBadge = notification.fromFirebase ? '<span class="firebase-mini-badge" title="من Firebase">🔥</span>' : '';

            return `
                <div class="notification-item ${readClass} ${priorityClass}" data-notification-id="${notification.id}">
                    <div class="notification-icon">
                        <i class="fas ${notification.icon}"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-header">
                            <span class="notification-title">${notification.title} ${firebaseBadge}</span>
                            <span class="notification-time">${timeAgo}</span>
                        </div>
                        <div class="notification-message">${notification.message}</div>
                        ${notification.actionText ? `
                            <button class="notification-action-btn" data-action-id="${notification.id}">
                                ${notification.actionText}
                            </button>
                        ` : ''}
                    </div>
                    <div class="notification-controls">
                        ${!notification.read ? `
                            <button class="control-btn" data-mark-read="${notification.id}" title="تحديد كمقروء">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        <button class="control-btn delete" data-delete-notification="${notification.id}" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }

        refreshNotificationsList() {
            const panel = document.getElementById('advanced-notifications-panel');
            if (panel) {
                const listContainer = panel.querySelector('.notifications-list');
                const filtered = this.getFilteredNotifications();
                
                if (filtered.length === 0) {
                    listContainer.innerHTML = '<div class="no-notifications"><i class="fas fa-inbox"></i><p>لا توجد إشعارات</p></div>';
                } else {
                    listContainer.innerHTML = filtered.map(n => this.getNotificationItemHTML(n)).join('');
                    this.attachNotificationItemListeners(listContainer);
                }

                const unreadCount = this.notifications.filter(n => !n.read).length;
                const badge = panel.querySelector('.unread-badge');
                if (badge) {
                    badge.textContent = unreadCount;
                    badge.style.display = unreadCount > 0 ? 'inline' : 'none';
                }
                
                // تحديث حالة Firebase
                const firebaseStatus = panel.querySelector('.firebase-status');
                if (firebaseStatus) {
                    firebaseStatus.className = `firebase-status ${this.firebaseConnected ? 'connected' : 'disconnected'}`;
                    firebaseStatus.textContent = this.firebaseConnected ? '🔥 متصل' : '⚠️ غير متصل';
                }
            }
        }

        setupPanelEventListeners(panel) {
            const closeBtn = panel.querySelector('[data-close-panel]');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closePanel());
            }

            panel.querySelectorAll('[data-filter-type]').forEach(select => {
                select.addEventListener('change', (e) => {
                    const filterType = e.target.getAttribute('data-filter-type');
                    this.setFilter(filterType, e.target.value);
                });
            });

            const markAllBtn = panel.querySelector('[data-mark-all-read]');
            if (markAllBtn) {
                markAllBtn.addEventListener('click', () => this.markAllAsRead());
            }

            const syncBtn = panel.querySelector('[data-sync-firebase]');
            if (syncBtn) {
                syncBtn.addEventListener('click', () => {
                    syncBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري المزامنة...';
                    this.syncNotificationsToFirebase().then(() => {
                        syncBtn.innerHTML = '<i class="fas fa-check"></i> تمت المزامنة';
                        setTimeout(() => {
                            syncBtn.innerHTML = '<i class="fas fa-sync-alt"></i> مزامنة Firebase';
                        }, 2000);
                    });
                });
            }

            const clearAllBtn = panel.querySelector('[data-clear-all]');
            if (clearAllBtn) {
                clearAllBtn.addEventListener('click', () => this.clearAll());
            }

            const settingsBtn = panel.querySelector('[data-show-settings]');
            if (settingsBtn) {
                settingsBtn.addEventListener('click', () => this.showSettings());
            }

            this.attachNotificationItemListeners(panel);

            setTimeout(() => {
                document.addEventListener('click', this.outsideClickHandler.bind(this));
            }, 100);
        }

        attachNotificationItemListeners(container) {
            container.querySelectorAll('[data-mark-read]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = parseFloat(btn.getAttribute('data-mark-read'));
                    this.markAsRead(id);
                });
            });

            container.querySelectorAll('[data-delete-notification]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = parseFloat(btn.getAttribute('data-delete-notification'));
                    this.deleteNotification(id);
                });
            });

            container.querySelectorAll('[data-action-id]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = parseFloat(btn.getAttribute('data-action-id'));
                    this.handleAction(id);
                });
            });
        }

        outsideClickHandler(e) {
            const panel = document.getElementById('advanced-notifications-panel');
            if (panel && !panel.contains(e.target) && !e.target.closest('.notification-bell')) {
                this.closePanel();
                document.removeEventListener('click', this.outsideClickHandler);
            }
        }

        closePanel() {
            const panel = document.getElementById('advanced-notifications-panel');
            if (panel) {
                panel.classList.remove('show');
                setTimeout(() => {
                    if (panel.parentNode) {
                        panel.parentNode.removeChild(panel);
                    }
                }, 300);
                document.removeEventListener('click', this.outsideClickHandler);
            }
        }

        showSettings() {
            const settingsHTML = `
                <div class="notification-settings-modal">
                    <h4><i class="fas fa-cog"></i> إعدادات الإشعارات</h4>
                    
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="setting-sound" ${NotificationConfig.SOUND_ENABLED ? 'checked' : ''}>
                            تفعيل الأصوات
                        </label>
                    </div>

                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="setting-desktop" ${NotificationConfig.DESKTOP_NOTIFICATIONS ? 'checked' : ''}>
                            إشعارات سطح المكتب
                        </label>
                    </div>

                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="setting-firebase-sync" ${NotificationConfig.FIREBASE_SYNC ? 'checked' : ''}>
                            <span style="display: flex; align-items: center; gap: 8px;">
                                مزامنة Firebase التلقائية
                                <span class="firebase-mini-badge">🔥</span>
                            </span>
                        </label>
                    </div>

                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="setting-firebase-realtime" ${NotificationConfig.FIREBASE_REALTIME ? 'checked' : ''}>
                            <span style="display: flex; align-items: center; gap: 8px;">
                                التحديثات الفورية من Firebase
                                <span class="firebase-mini-badge">🔥</span>
                            </span>
                        </label>
                    </div>

                    <div class="setting-item">
                        <label>
                            مدة الإخفاء التلقائي (ثانية):
                            <input type="number" id="setting-autodismiss" value="${NotificationConfig.AUTO_DISMISS / 1000}" min="0" max="60">
                        </label>
                    </div>

                    <div class="setting-item">
                        <label>
                            أيام التنبيه قبل الجلسات:
                            <input type="text" id="setting-hearing-days" value="${NotificationConfig.HEARING_WARNING_DAYS.join(', ')}">
                        </label>
                    </div>

                    <div class="settings-actions">
                        <button class="btn btn-primary" data-save-settings>
                            <i class="fas fa-save"></i> حفظ
                        </button>
                        <button class="btn btn-secondary" data-close-settings>
                            إلغاء
                        </button>
                    </div>
                </div>
            `;

            const modal = document.createElement('div');
            modal.id = 'notification-settings-overlay';
            modal.className = 'notification-settings-overlay';
            modal.innerHTML = settingsHTML;
            document.body.appendChild(modal);

            setTimeout(() => modal.classList.add('show'), 10);

            const saveBtn = modal.querySelector('[data-save-settings]');
            if (saveBtn) {
                saveBtn.addEventListener('click', () => this.saveSettings());
            }

            const closeBtn = modal.querySelector('[data-close-settings]');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeSettings());
            }
        }

        saveSettings() {
            NotificationConfig.SOUND_ENABLED = document.getElementById('setting-sound').checked;
            NotificationConfig.DESKTOP_NOTIFICATIONS = document.getElementById('setting-desktop').checked;
            NotificationConfig.FIREBASE_SYNC = document.getElementById('setting-firebase-sync').checked;
            NotificationConfig.FIREBASE_REALTIME = document.getElementById('setting-firebase-realtime').checked;
            NotificationConfig.AUTO_DISMISS = parseInt(document.getElementById('setting-autodismiss').value) * 1000;
            
            const hearingDaysStr = document.getElementById('setting-hearing-days').value;
            NotificationConfig.HEARING_WARNING_DAYS = hearingDaysStr.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d));

            if (NotificationConfig.DESKTOP_NOTIFICATIONS && 'Notification' in window) {
                Notification.requestPermission();
            }

            // إعادة إعداد Firebase إذا تغيرت الإعدادات
            if (NotificationConfig.FIREBASE_REALTIME && !this.firebaseListener) {
                this.setupFirebaseRealtimeListeners();
            } else if (!NotificationConfig.FIREBASE_REALTIME && this.firebaseListener) {
                this.firebaseListener.off();
                this.firebaseListener = null;
            }

            localStorage.setItem('notification_config', JSON.stringify(NotificationConfig));
            
            this.closeSettings();
            this.soundManager.play('success');
            
            setTimeout(() => {
                this.createNotification({
                    type: NotificationConfig.TYPES.SYSTEM,
                    priority: NotificationConfig.PRIORITIES.LOW,
                    title: 'تم الحفظ',
                    message: 'تم حفظ إعدادات الإشعارات بنجاح',
                    skipFirebaseSync: true
                });
            }, 500);
        }

        closeSettings() {
            const overlay = document.getElementById('notification-settings-overlay');
            if (overlay) {
                overlay.classList.remove('show');
                setTimeout(() => {
                    if (overlay.parentNode) {
                        overlay.parentNode.removeChild(overlay);
                    }
                }, 300);
            }
        }

        updateBadge() {
            const unreadCount = this.notifications.filter(n => !n.read).length;
            const badge = document.getElementById('notification-count');
            if (badge) {
                badge.textContent = unreadCount;
                badge.style.display = unreadCount > 0 ? 'flex' : 'none';
            }
        }

        getTimeAgo(timestamp) {
            const now = new Date();
            const then = new Date(timestamp);
            const seconds = Math.floor((now - then) / 1000);

            if (seconds < 60) return 'الآن';
            if (seconds < 3600) return `منذ ${Math.floor(seconds / 60)} دقيقة`;
            if (seconds < 86400) return `منذ ${Math.floor(seconds / 3600)} ساعة`;
            if (seconds < 604800) return `منذ ${Math.floor(seconds / 86400)} يوم`;
            return `منذ ${Math.floor(seconds / 604800)} أسبوع`;
        }

        formatNumber(num) {
            return new Intl.NumberFormat('ar-EG').format(num);
        }

        destroy() {
            if (this.checkTimer) {
                clearInterval(this.checkTimer);
            }
            if (this.firebaseListener) {
                this.firebaseListener.off();
            }
            document.removeEventListener('click', this.outsideClickHandler);
        }

        injectStyles() {
            if (document.getElementById('advanced-notifications-styles')) return;
            
            const styles = document.createElement('style');
            styles.id = 'advanced-notifications-styles';
            styles.textContent = `
                /* Notification Popup */
                .advanced-notification-popup {
                    position: fixed;
                    top: 100px;
                    right: 20px;
                    width: 380px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                    z-index: 10000;
                    transform: translateX(450px);
                    transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                    overflow: hidden;
                }

                .advanced-notification-popup.show {
                    transform: translateX(0);
                }

                .advanced-notification-popup.priority-critical {
                    border-right: 5px solid #ef4444;
                }

                .advanced-notification-popup.priority-high {
                    border-right: 5px solid #f59e0b;
                }

                .advanced-notification-popup.priority-medium {
                    border-right: 5px solid #3b82f6;
                }

                .advanced-notification-popup.priority-low {
                    border-right: 5px solid #10b981;
                }

                .notification-popup-content {
                    padding: 16px;
                }

                .notification-popup-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 12px;
                }

                .notification-popup-icon {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #3b82f6, #6366f1);
                    color: white;
                    font-size: 16px;
                }

                .notification-popup-title {
                    flex: 1;
                    font-weight: 700;
                    color: #1f2937;
                    font-size: 15px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .firebase-badge {
                    font-size: 12px;
                    padding: 2px 6px;
                    background: linear-gradient(135deg, #ff6b6b, #ff8787);
                    border-radius: 4px;
                    animation: pulse 2s infinite;
                }

                .firebase-mini-badge {
                    font-size: 10px;
                    display: inline-block;
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(0.95); }
                }

                .notification-popup-close {
                    background: none;
                    border: none;
                    color: #9ca3af;
                    cursor: pointer;
                    padding: 4px 8px;
                    border-radius: 4px;
                    transition: all 0.2s;
                }

                .notification-popup-close:hover {
                    background: #f3f4f6;
                    color: #4b5563;
                }

                .notification-popup-body {
                    color: #4b5563;
                    font-size: 14px;
                    line-height: 1.6;
                    margin-bottom: 12px;
                }

                .notification-popup-actions {
                    display: flex;
                    gap: 8px;
                }

                .notification-popup-action {
                    flex: 1;
                    padding: 8px 16px;
                    background: linear-gradient(135deg, #3b82f6, #6366f1);
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-weight: 600;
                    font-size: 13px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .notification-popup-action:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
                }

                .notification-popup-progress {
                    height: 3px;
                    background: linear-gradient(90deg, #3b82f6, #6366f1);
                    animation: progress 10s linear;
                }

                @keyframes progress {
                    from { width: 100%; }
                    to { width: 0%; }
                }

                /* Notifications Panel */
                .advanced-notifications-panel {
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    width: 420px;
                    max-height: 600px;
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    z-index: 9999;
                    display: flex;
                    flex-direction: column;
                    transform: translateX(450px);
                    opacity: 0;
                    transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                }

                .advanced-notifications-panel.show {
                    transform: translateX(0);
                    opacity: 1;
                }

                .notifications-panel-header {
                    padding: 20px;
                    border-bottom: 1px solid #e5e7eb;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: linear-gradient(135deg, #f8fafc, #e2e8f0);
                    flex-wrap: wrap;
                    gap: 10px;
                }

                .notifications-panel-header h3 {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 18px;
                    color: #1f2937;
                    margin: 0;
                }

                .firebase-status {
                    font-size: 12px;
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-weight: 600;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                }

                .firebase-status.connected {
                    background: #d1fae5;
                    color: #065f46;
                }

                .firebase-status.disconnected {
                    background: #fee2e2;
                    color: #991b1b;
                }

                .unread-badge {
                    background: #ef4444;
                    color: white;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 700;
                }

                .panel-close-btn {
                    background: none;
                    border: none;
                    color: #6b7280;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 6px;
                    transition: all 0.2s;
                }

                .panel-close-btn:hover {
                    background: #f3f4f6;
                    color: #1f2937;
                }

                .notifications-filters {
                    padding: 16px;
                    display: flex;
                    gap: 8px;
                    background: #f9fafb;
                    border-bottom: 1px solid #e5e7eb;
                }

                .notifications-filters select {
                    flex: 1;
                    padding: 8px 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 13px;
                    background: white;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .notifications-filters select:focus {
                    outline: none;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                .notifications-actions {
                    padding: 12px 16px;
                    display: flex;
                    gap: 8px;
                    background: #f9fafb;
                    border-bottom: 1px solid #e5e7eb;
                    flex-wrap: wrap;
                }

                .notifications-actions .action-btn {
                    flex: 1;
                    min-width: 120px;
                    padding: 8px 12px;
                    background: white;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                }

                .notifications-actions .action-btn:hover {
                    background: #f3f4f6;
                    border-color: #9ca3af;
                }

                .firebase-sync-btn {
                    background: linear-gradient(135deg, #ff6b6b, #ff8787) !important;
                    color: white !important;
                    border: none !important;
                }

                .firebase-sync-btn:hover {
                    background: linear-gradient(135deg, #ff5252, #ff7070) !important;
                }

                .notifications-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 8px;
                }

                .notification-item {
                    display: flex;
                    gap: 12px;
                    padding: 12px;
                    border-radius: 8px;
                    margin-bottom: 8px;
                    transition: all 0.2s;
                    border: 1px solid transparent;
                }

                .notification-item.unread {
                    background: #eff6ff;
                    border-color: #bfdbfe;
                }

                .notification-item.read {
                    background: #f9fafb;
                }

                .notification-item:hover {
                    transform: translateX(-2px);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }

                .notification-item.priority-critical {
                    border-right: 3px solid #ef4444;
                }

                .notification-item.priority-high {
                    border-right: 3px solid #f59e0b;
                }

                .notification-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #3b82f6, #6366f1);
                    color: white;
                    flex-shrink: 0;
                }

                .notification-content {
                    flex: 1;
                    min-width: 0;
                }

                .notification-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 4px;
                }

                .notification-title {
                    font-weight: 700;
                    color: #1f2937;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .notification-time {
                    font-size: 11px;
                    color: #9ca3af;
                }

                .notification-message {
                    font-size: 13px;
                    color: #4b5563;
                    line-height: 1.5;
                    margin-bottom: 8px;
                }

                .notification-action-btn {
                    padding: 6px 12px;
                    background: linear-gradient(135deg, #3b82f6, #6366f1);
                    color: white;
                    border: none;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .notification-action-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
                }

                .notification-controls {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .notification-controls .control-btn {
                    width: 28px;
                    height: 28px;
                    border: none;
                    background: white;
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    color: #6b7280;
                }

                .notification-controls .control-btn:hover {
                    background: #f3f4f6;
                    color: #1f2937;
                }

                .notification-controls .control-btn.delete:hover {
                    background: #fee2e2;
                    color: #ef4444;
                }

                .no-notifications {
                    text-align: center;
                    padding: 60px 20px;
                    color: #9ca3af;
                }

                .no-notifications i {
                    font-size: 48px;
                    margin-bottom: 16px;
                    opacity: 0.5;
                }

                .notifications-settings {
                    padding: 12px 16px;
                    border-top: 1px solid #e5e7eb;
                    background: #f9fafb;
                }

                .settings-btn {
                    width: 100%;
                    padding: 10px;
                    background: white;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }

                .settings-btn:hover {
                    background: #f3f4f6;
                    border-color: #9ca3af;
                }

                /* Settings Modal */
                .notification-settings-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10001;
                    opacity: 0;
                    transition: opacity 0.3s;
                }

                .notification-settings-overlay.show {
                    opacity: 1;
                }

                .notification-settings-modal {
                    background: white;
                    border-radius: 12px;
                    padding: 24px;
                    width: 90%;
                    max-width: 500px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                }

                .notification-settings-modal h4 {
                    margin-bottom: 20px;
                    color: #1f2937;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .setting-item {
                    padding: 12px 0;
                    border-bottom: 1px solid #e5e7eb;
                }

                .setting-item:last-of-type {
                    border-bottom: none;
                }

                .setting-item label {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    font-size: 14px;
                    color: #4b5563;
                }

                .setting-item input[type="checkbox"] {
                    width: 20px;
                    height: 20px;
                    cursor: pointer;
                }

                .setting-item input[type="number"],
                .setting-item input[type="text"] {
                    flex: 1;
                    padding: 8px 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    margin-right: 10px;
                }

                .settings-actions {
                    margin-top: 20px;
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                }

                .settings-actions .btn {
                    padding: 10px 20px;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                }

                .btn-primary {
                    background: linear-gradient(135deg, #3b82f6, #6366f1);
                    color: white;
                }

                .btn-primary:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
                }

                .btn-secondary {
                    background: #e5e7eb;
                    color: #4b5563;
                }

                .btn-secondary:hover {
                    background: #d1d5db;
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .advanced-notification-popup,
                    .advanced-notifications-panel {
                        width: calc(100% - 40px);
                        right: 20px;
                        left: 20px;
                    }

                    .advanced-notification-popup {
                        transform: translateY(-150px);
                    }

                    .advanced-notification-popup.show {
                        transform: translateY(0);
                    }

                    .advanced-notifications-panel {
                        max-height: calc(100vh - 100px);
                    }
                    
                    .notifications-actions {
                        flex-direction: column;
                    }
                    
                    .notifications-actions .action-btn {
                        width: 100%;
                    }
                }
            `;
            
            document.head.appendChild(styles);
        }
    }

    // ==================== التهيئة التلقائية ====================
    function initNotificationSystem() {
        if (window.dataManager) {
            window.notificationManager = new NotificationManager();
            console.log('✅ نظام الإشعارات المتقدم مع Firebase جاهز');
        } else {
            setTimeout(initNotificationSystem, 500);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNotificationSystem);
    } else {
        initNotificationSystem();
    }

    window.addEventListener('beforeunload', () => {
        if (window.notificationManager) {
            window.notificationManager.destroy();
        }
    });







    

})();

