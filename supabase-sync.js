// supabase-sync.js
/**
 * نظام المزامنة مع Supabase لتطبيق إدارة الدعاوى القضائية
 * يعمل مع التخزين المحلي ويزامن البيانات مع السحابة عند الطلب
 */

const SUPABASE_URL = 'https://dopzopezvkwdoeeliwwd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcHpvcGV6dmt3ZG9lZWxpd3dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMzg2MDQsImV4cCI6MjA3NDgxNDYwNH0.VZjhi0-tx5EvFwEXUfjCWyMujwbvGrGisSeOdYm0Rnk';

class SupabaseSync {
    constructor() {
        this.supabase = null;
        this.userId = null;
        this.syncEnabled = false;
        this.autoSync = false;
        this.lastSyncTime = null;
        this.isOnline = navigator.onLine;
        this.syncInProgress = false;
        
        this.initSupabase();
        this.loadSyncSettings();
        this.setupEventListeners();
    }

    // تهيئة Supabase
    initSupabase() {
        try {
            // تحميل مكتبة Supabase من CDN
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = () => {
                this.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
                console.log('تم تهيئة Supabase بنجاح');
                this.checkAuth();
            };
            script.onerror = () => {
                console.error('فشل تحميل مكتبة Supabase');
                showNotification('خطأ', 'فشل الاتصال بخادم المزامنة', 'error');
            };
            document.head.appendChild(script);
        } catch (error) {
            console.error('خطأ في تهيئة Supabase:', error);
        }
    }

    // التحقق من المصادقة
    async checkAuth() {
        if (!this.supabase) return;
        
        try {
            const { data: { session } } = await this.supabase.auth.getSession();
            if (session) {
                this.userId = session.user.id;
                this.syncEnabled = true;
                console.log('المستخدم مسجل الدخول:', this.userId);
                
                if (this.autoSync) {
                    this.syncAllData();
                }
            } else {
                // محاولة تسجيل دخول تلقائي أو إنشاء مستخدم مؤقت
                await this.createAnonymousUser();
            }
        } catch (error) {
            console.error('خطأ في التحقق من المصادقة:', error);
        }
    }

    // إنشاء مستخدم مؤقت
    async createAnonymousUser() {
        try {
            // استخدام معرف فريد مخزن محلياً
            let deviceId = localStorage.getItem('deviceId');
            if (!deviceId) {
                deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('deviceId', deviceId);
            }
            this.userId = deviceId;
            console.log('تم إنشاء معرف جهاز:', this.userId);
        } catch (error) {
            console.error('خطأ في إنشاء مستخدم مؤقت:', error);
        }
    }

    // تحميل إعدادات المزامنة
    loadSyncSettings() {
        const settings = LocalStorage.load('syncSettings', {
            enabled: false,
            autoSync: false,
            syncInterval: 30, // دقيقة
            lastSync: null
        });
        
        this.syncEnabled = settings.enabled;
        this.autoSync = settings.autoSync;
        this.lastSyncTime = settings.lastSync;
        
        // إعداد المزامنة التلقائية
        if (this.autoSync && settings.syncInterval > 0) {
            this.setupAutoSync(settings.syncInterval);
        }
    }

    // حفظ إعدادات المزامنة
    saveSyncSettings() {
        const settings = {
            enabled: this.syncEnabled,
            autoSync: this.autoSync,
            syncInterval: this.syncInterval || 30,
            lastSync: this.lastSyncTime
        };
        LocalStorage.save('syncSettings', settings);
    }

    // إعداد المزامنة التلقائية
    setupAutoSync(intervalMinutes) {
        if (this.autoSyncInterval) {
            clearInterval(this.autoSyncInterval);
        }
        
        this.autoSyncInterval = setInterval(() => {
            if (this.syncEnabled && this.isOnline && !this.syncInProgress) {
                this.syncAllData();
            }
        }, intervalMinutes * 60 * 1000);
    }

    // إعداد مستمعي الأحداث
    setupEventListeners() {
        // مراقبة حالة الاتصال
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('تم الاتصال بالإنترنت');
            if (this.autoSync) {
                this.syncAllData();
            }
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('انقطع الاتصال بالإنترنت');
        });

        // المزامنة قبل إغلاق الصفحة
        window.addEventListener('beforeunload', () => {
            if (this.syncEnabled && this.isOnline) {
                this.savePendingChanges();
            }
        });
    }

    // ===== دوال المزامنة الرئيسية =====

    // مزامنة جميع البيانات
    async syncAllData() {
        if (!this.syncEnabled || !this.isOnline || this.syncInProgress) {
            return false;
        }

        this.syncInProgress = true;
        showNotification('المزامنة', 'جارٍ مزامنة البيانات...', 'info');

        try {
            const syncResults = {
                cases: await this.syncCases(),
                defendants: await this.syncDefendants(),
                lawyers: await this.syncLawyers(),
                deductions: await this.syncDeductions(),
                notifications: await this.syncNotifications(),
                settings: await this.syncSettings()
            };

            this.lastSyncTime = new Date().toISOString();
            this.saveSyncSettings();

            const totalSynced = Object.values(syncResults).reduce((sum, result) => sum + result.synced, 0);
            const totalErrors = Object.values(syncResults).reduce((sum, result) => sum + result.errors, 0);

            if (totalErrors === 0) {
                showNotification('نجاح المزامنة', `تم مزامنة ${totalSynced} عنصر بنجاح`, 'success');
            } else {
                showNotification('المزامنة مكتملة مع أخطاء', `تم مزامنة ${totalSynced} عنصر مع ${totalErrors} خطأ`, 'warning');
            }

            this.syncInProgress = false;
            return true;

        } catch (error) {
            console.error('خطأ في المزامنة:', error);
            showNotification('خطأ في المزامنة', 'فشلت عملية المزامنة: ' + error.message, 'error');
            this.syncInProgress = false;
            return false;
        }
    }

    // مزامنة الدعاوى
    async syncCases() {
        const result = { synced: 0, errors: 0 };
        
        try {
            const localCases = dataManager.casesData || [];
            
            // جلب البيانات من السحابة
            const { data: cloudCases, error: fetchError } = await this.supabase
                .from('cases')
                .select('*')
                .eq('user_id', this.userId);

            if (fetchError) throw fetchError;

            // دمج البيانات المحلية مع السحابية
            const mergedCases = this.mergeCases(localCases, cloudCases || []);

            // رفع البيانات الجديدة أو المحدثة
            for (const caseItem of mergedCases.toUpload) {
                const caseData = this.transformCaseForDB(caseItem);
                caseData.user_id = this.userId;
                caseData.synced_at = new Date().toISOString();
                
                delete caseData.id; // حذف المعرف المحلي
                
                const { error } = await this.supabase
                    .from('cases')
                    .upsert(caseData, { 
                        onConflict: 'user_id,case_number',
                        returning: 'minimal'
                    });

                if (error) {
                    console.error('خطأ في رفع الدعوى:', error);
                    result.errors++;
                } else {
                    result.synced++;
                }
            }

            // حفظ البيانات المدمجة محلياً
            dataManager.casesData = mergedCases.final;
            dataManager.saveData();

            return result;

        } catch (error) {
            console.error('خطأ في مزامنة الدعاوى:', error);
            result.errors++;
            return result;
        }
    }

    // دمج الدعاوى المحلية والسحابية
    mergeCases(localCases, cloudCases) {
        const merged = new Map();
        const toUpload = [];

        // إضافة الدعاوى السحابية
        cloudCases.forEach(cloudCase => {
            merged.set(cloudCase.case_number, {
                ...cloudCase,
                cloudId: cloudCase.id,
                fromCloud: true
            });
        });

        // دمج الدعاوى المحلية
        localCases.forEach(localCase => {
            const caseNumber = localCase.caseNumber || localCase.case_number;
            const existing = merged.get(caseNumber);
            
            if (!existing) {
                // دعوى محلية جديدة تحتاج للرفع
                toUpload.push({
                    ...localCase,
                    cloud_id: localCase.cloudId || null
                });
                merged.set(caseNumber, localCase);
            } else {
                // التحقق من أيهما أحدث
                const localTime = new Date(localCase.lastUpdate || localCase.last_update || localCase.createdAt || localCase.created_at);
                const cloudTime = new Date(existing.last_update || existing.created_at);
                
                if (localTime > cloudTime) {
                    // البيانات المحلية أحدث
                    toUpload.push({
                        ...localCase,
                        cloud_id: existing.cloudId
                    });
                    merged.set(caseNumber, localCase);
                }
            }
        });

        return {
            final: Array.from(merged.values()),
            toUpload
        };
    }

    // مزامنة المدعى عليهم
    async syncDefendants() {
        const result = { synced: 0, errors: 0 };
        
        try {
            const localDefendants = dataManager.defendantsData || [];
            
            const { data: cloudDefendants, error: fetchError } = await this.supabase
                .from('defendants')
                .select('*')
                .eq('user_id', this.userId);

            if (fetchError) throw fetchError;

            const mergedDefendants = this.mergeDefendants(localDefendants, cloudDefendants || []);

            for (const defendant of mergedDefendants.toUpload) {
                const defendantData = this.transformDefendantForDB(defendant);
                defendantData.user_id = this.userId;
                defendantData.synced_at = new Date().toISOString();
                
                delete defendantData.id;
                
                const { error } = await this.supabase
                    .from('defendants')
                    .upsert(defendantData, { 
                        onConflict: 'user_id,name',
                        returning: 'minimal'
                    });

                if (error) {
                    console.error('خطأ في رفع المدعى عليه:', error);
                    result.errors++;
                } else {
                    result.synced++;
                }
            }

            dataManager.defendantsData = mergedDefendants.final;
            dataManager.saveData();

            return result;

        } catch (error) {
            console.error('خطأ في مزامنة المدعى عليهم:', error);
            result.errors++;
            return result;
        }
    }

    mergeDefendants(localDefendants, cloudDefendants) {
        const merged = new Map();
        const toUpload = [];

        cloudDefendants.forEach(defendant => {
            merged.set(defendant.name, {
                ...defendant,
                cloudId: defendant.id,
                fromCloud: true
            });
        });

        localDefendants.forEach(localDefendant => {
            const existing = merged.get(localDefendant.name);
            
            if (!existing) {
                toUpload.push({
                    ...localDefendant,
                    cloud_id: localDefendant.cloudId || null
                });
                merged.set(localDefendant.name, localDefendant);
            } else {
                const localTime = new Date(localDefendant.createdAt);
                const cloudTime = new Date(existing.created_at);
                
                if (localTime > cloudTime) {
                    toUpload.push({
                        ...localDefendant,
                        cloud_id: existing.cloudId
                    });
                    merged.set(localDefendant.name, localDefendant);
                }
            }
        });

        return {
            final: Array.from(merged.values()),
            toUpload
        };
    }

    // مزامنة المحامين
    async syncLawyers() {
        const result = { synced: 0, errors: 0 };
        
        try {
            const localLawyers = dataManager.lawyersData || [];
            
            const { data: cloudLawyers, error: fetchError } = await this.supabase
                .from('lawyers')
                .select('*')
                .eq('user_id', this.userId);

            if (fetchError) throw fetchError;

            const mergedLawyers = this.mergeLawyers(localLawyers, cloudLawyers || []);

            for (const lawyer of mergedLawyers.toUpload) {
                const lawyerData = this.transformLawyerForDB(lawyer);
                lawyerData.user_id = this.userId;
                lawyerData.synced_at = new Date().toISOString();
                
                delete lawyerData.id;
                
                const { error } = await this.supabase
                    .from('lawyers')
                    .upsert(lawyerData, { 
                        onConflict: 'user_id,license',
                        returning: 'minimal'
                    });

                if (error) {
                    console.error('خطأ في رفع المحامي:', error);
                    result.errors++;
                } else {
                    result.synced++;
                }
            }

            dataManager.lawyersData = mergedLawyers.final;
            dataManager.saveData();

            return result;

        } catch (error) {
            console.error('خطأ في مزامنة المحامين:', error);
            result.errors++;
            return result;
        }
    }

    mergeLawyers(localLawyers, cloudLawyers) {
        const merged = new Map();
        const toUpload = [];

        cloudLawyers.forEach(lawyer => {
            merged.set(lawyer.license, {
                ...lawyer,
                cloudId: lawyer.id,
                fromCloud: true
            });
        });

        localLawyers.forEach(localLawyer => {
            const existing = merged.get(localLawyer.license);
            
            if (!existing) {
                toUpload.push({
                    ...localLawyer,
                    cloud_id: localLawyer.cloudId || null
                });
                merged.set(localLawyer.license, localLawyer);
            } else {
                const localTime = new Date(localLawyer.registrationDate);
                const cloudTime = new Date(existing.registration_date);
                
                if (localTime > cloudTime) {
                    toUpload.push({
                        ...localLawyer,
                        cloud_id: existing.cloudId
                    });
                    merged.set(localLawyer.license, localLawyer);
                }
            }
        });

        return {
            final: Array.from(merged.values()),
            toUpload
        };
    }

    // مزامنة الاستقطاعات
    async syncDeductions() {
        const result = { synced: 0, errors: 0 };
        
        try {
            const localDeductions = dataManager.deductionsData || [];
            
            const { data: cloudDeductions, error: fetchError } = await this.supabase
                .from('deductions')
                .select('*')
                .eq('user_id', this.userId);

            if (fetchError) throw fetchError;

            const mergedDeductions = this.mergeDeductions(localDeductions, cloudDeductions || []);

            for (const deduction of mergedDeductions.toUpload) {
                const deductionData = this.transformDeductionForDB(deduction);
                deductionData.user_id = this.userId;
                deductionData.synced_at = new Date().toISOString();
                
                delete deductionData.id;
                
                const { error } = await this.supabase
                    .from('deductions')
                    .insert(deductionData);

                if (error) {
                    console.error('خطأ في رفع الاستقطاع:', error);
                    result.errors++;
                } else {
                    result.synced++;
                }
            }

            dataManager.deductionsData = mergedDeductions.final;
            dataManager.saveData();

            return result;

        } catch (error) {
            console.error('خطأ في مزامنة الاستقطاعات:', error);
            result.errors++;
            return result;
        }
    }

    mergeDeductions(localDeductions, cloudDeductions) {
        const merged = new Map();
        const toUpload = [];

        cloudDeductions.forEach(deduction => {
            const key = `${deduction.case_number}_${deduction.date}_${deduction.amount}`;
            merged.set(key, {
                ...deduction,
                cloudId: deduction.id,
                fromCloud: true
            });
        });

        localDeductions.forEach(localDeduction => {
            const caseNumber = localDeduction.caseNumber || localDeduction.case_number;
            const key = `${caseNumber}_${localDeduction.date}_${localDeduction.amount}`;
            const existing = merged.get(key);
            
            if (!existing) {
                toUpload.push({
                    ...localDeduction,
                    cloud_id: localDeduction.cloudId || null
                });
                merged.set(key, localDeduction);
            }
        });

        return {
            final: Array.from(merged.values()),
            toUpload
        };
    }

    // مزامنة الإشعارات
    async syncNotifications() {
        const result = { synced: 0, errors: 0 };
        
        try {
            const localNotifications = dataManager.notificationsData || [];
            
            const { data: cloudNotifications, error: fetchError } = await this.supabase
                .from('notifications')
                .select('*')
                .eq('user_id', this.userId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (fetchError) throw fetchError;

            // دمج الإشعارات
            const allNotifications = [...localNotifications];
            
            (cloudNotifications || []).forEach(cloudNotif => {
                if (!allNotifications.find(n => n.cloudId === cloudNotif.id)) {
                    allNotifications.push({
                        ...cloudNotif,
                        cloudId: cloudNotif.id,
                        fromCloud: true
                    });
                }
            });

            // ترتيب حسب التاريخ والاحتفاظ بآخر 50
            allNotifications.sort((a, b) => 
                new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at)
            );
            
            dataManager.notificationsData = allNotifications.slice(0, 50);
            dataManager.saveData();
            
            result.synced = allNotifications.length;
            return result;

        } catch (error) {
            console.error('خطأ في مزامنة الإشعارات:', error);
            result.errors++;
            return result;
        }
    }

    // تحويل بيانات الدعوى للتوافق مع قاعدة البيانات
    transformCaseForDB(caseData) {
        const transformed = {
            case_number: caseData.caseNumber || caseData.case_number,
            file_date: caseData.fileDate || caseData.file_date,
            priority: caseData.priority,
            status: caseData.status,
            subject: caseData.subject,
            amount: caseData.amount,
            plaintiff_name: caseData.plaintiffName || caseData.plaintiff_name,
            plaintiff_phone: caseData.plaintiffPhone || caseData.plaintiff_phone,
            plaintiff_address: caseData.plaintiffAddress || caseData.plaintiff_address,
            defendant_name: caseData.defendantName || caseData.defendant_name,
            defendant_address: caseData.defendantAddress || caseData.defendant_address,
            lawyer_name: caseData.lawyerName || caseData.lawyer_name,
            court_name: caseData.courtName || caseData.court_name,
            court_section: caseData.courtSection || caseData.court_section,
            stage: caseData.stage,
            next_hearing: caseData.nextHearing || caseData.next_hearing,
            notes: caseData.notes,
            documents: caseData.documents,
            execution_options: caseData.executionOptions || caseData.execution_options,
            deductions: caseData.deductions,
            timeline: caseData.timeline,
            created_at: caseData.createdAt || caseData.created_at,
            last_update: caseData.lastUpdate || caseData.last_update
        };
        
        // إزالة القيم الفارغة
        Object.keys(transformed).forEach(key => {
            if (transformed[key] === undefined) {
                delete transformed[key];
            }
        });
        
        return transformed;
    }

    // تحويل بيانات المدعى عليه للتوافق مع قاعدة البيانات
    transformDefendantForDB(defendantData) {
        const transformed = {
            name: defendantData.name,
            phone: defendantData.phone,
            email: defendantData.email,
            workplace: defendantData.workplace,
            address: defendantData.address,
            cases_count: defendantData.casesCount || defendantData.cases_count || 0,
            registration_date: defendantData.registrationDate || defendantData.registration_date,
            created_at: defendantData.createdAt || defendantData.created_at
        };
        
        // إزالة القيم الفارغة
        Object.keys(transformed).forEach(key => {
            if (transformed[key] === undefined) {
                delete transformed[key];
            }
        });
        
        return transformed;
    }

    // تحويل بيانات المحامي للتوافق مع قاعدة البيانات
    transformLawyerForDB(lawyerData) {
        const transformed = {
            name: lawyerData.name,
            license: lawyerData.license,
            phone: lawyerData.phone,
            specialization: lawyerData.specialization,
            email: lawyerData.email,
            experience: lawyerData.experience,
            address: lawyerData.address,
            notes: lawyerData.notes,
            cases_count: lawyerData.casesCount || lawyerData.cases_count || 0,
            registration_date: lawyerData.registrationDate || lawyerData.registration_date,
            created_at: lawyerData.createdAt || lawyerData.created_at
        };
        
        // إزالة القيم الفارغة
        Object.keys(transformed).forEach(key => {
            if (transformed[key] === undefined) {
                delete transformed[key];
            }
        });
        
        return transformed;
    }

    // تحويل بيانات الاستقطاع للتوافق مع قاعدة البيانات
    transformDeductionForDB(deductionData) {
        const transformed = {
            plaintiff_name: deductionData.plaintiffName || deductionData.plaintiff_name,
            case_number: deductionData.caseNumber || deductionData.case_number,
            amount: deductionData.amount,
            date: deductionData.date,
            source: deductionData.source,
            notes: deductionData.notes,
            status: deductionData.status,
            created_at: deductionData.createdAt || deductionData.created_at
        };
        
        // إزالة القيم الفارغة
        Object.keys(transformed).forEach(key => {
            if (transformed[key] === undefined) {
                delete transformed[key];
            }
        });
        
        return transformed;
    }

    // مزامنة الإعدادات
    async syncSettings() {
        const result = { synced: 0, errors: 0 };
        
        try {
            const localSettings = dataManager.settingsData || {};
            
            const { data: cloudSettings, error: fetchError } = await this.supabase
                .from('settings')
                .select('*')
                .eq('user_id', this.userId)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

            if (cloudSettings) {
                // دمج الإعدادات
                dataManager.settingsData = {
                    ...cloudSettings.settings_json,
                    ...localSettings
                };
            } else {
                // رفع الإعدادات المحلية
                const { error } = await this.supabase
                    .from('settings')
                    .insert({
                        user_id: this.userId,
                        settings_json: localSettings,
                        updated_at: new Date().toISOString()
                    });

                if (error) throw error;
            }

            dataManager.saveData();
            result.synced = 1;
            return result;

        } catch (error) {
            console.error('خطأ في مزامنة الإعدادات:', error);
            result.errors++;
            return result;
        }
    }

    // حفظ التغييرات المعلقة
    async savePendingChanges() {
        const pending = LocalStorage.load('pendingSync', []);
        if (pending.length === 0) return;

        try {
            for (const change of pending) {
                await this.syncSingleItem(change);
            }
            LocalStorage.save('pendingSync', []);
        } catch (error) {
            console.error('خطأ في حفظ التغييرات المعلقة:', error);
        }
    }

    // مزامنة عنصر واحد
    async syncSingleItem(item) {
        if (!this.supabase || !this.userId) return;

        try {
            const { error } = await this.supabase
                .from(item.table)
                .upsert({
                    ...item.data,
                    user_id: this.userId,
                    synced_at: new Date().toISOString()
                });

            if (error) throw error;
        } catch (error) {
            console.error('خطأ في مزامنة العنصر:', error);
            // إضافة للقائمة المعلقة
            const pending = LocalStorage.load('pendingSync', []);
            pending.push(item);
            LocalStorage.save('pendingSync', pending);
        }
    }

    // تمكين/تعطيل المزامنة
    toggleSync(enabled) {
        this.syncEnabled = enabled;
        this.saveSyncSettings();
        
        if (enabled && this.isOnline) {
            this.syncAllData();
        }
    }

    // تمكين/تعطيل المزامنة التلقائية
    toggleAutoSync(enabled, intervalMinutes = 30) {
        this.autoSync = enabled;
        this.syncInterval = intervalMinutes;
        this.saveSyncSettings();
        
        if (enabled) {
            this.setupAutoSync(intervalMinutes);
        } else if (this.autoSyncInterval) {
            clearInterval(this.autoSyncInterval);
        }
    }

    // الحصول على حالة المزامنة
    getSyncStatus() {
        return {
            enabled: this.syncEnabled,
            autoSync: this.autoSync,
            isOnline: this.isOnline,
            lastSync: this.lastSyncTime,
            inProgress: this.syncInProgress,
            userId: this.userId
        };
    }

    // مسح البيانات السحابية
    async clearCloudData() {
        if (!this.supabase || !this.userId) return false;

        if (!confirm('هل أنت متأكد من حذف جميع البيانات السحابية؟ لا يمكن التراجع عن هذا الإجراء.')) {
            return false;
        }

        try {
            const tables = ['cases', 'defendants', 'lawyers', 'deductions', 'notifications', 'settings'];
            
            for (const table of tables) {
                const { error } = await this.supabase
                    .from(table)
                    .delete()
                    .eq('user_id', this.userId);
                    
                if (error) {
                    console.error(`خطأ في حذف ${table}:`, error);
                }
            }

            showNotification('تم الحذف', 'تم حذف جميع البيانات السحابية بنجاح', 'success');
            return true;

        } catch (error) {
            console.error('خطأ في مسح البيانات السحابية:', error);
            showNotification('خطأ', 'فشل حذف البيانات السحابية', 'error');
            return false;
        }
    }
}

// إنشاء نسخة واحدة من SupabaseSync
window.supabaseSync = new SupabaseSync();
