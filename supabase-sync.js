/**
 * نظام المزامنة الشامل مع Supabase
 * يدعم المزامنة في الوقت الحقيقي لجميع بيانات التطبيق
 */

// إعدادات Supabase
const SUPABASE_CONFIG = {
    url: 'https://dopzopezvkwdoeeliwwd.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcHpvcGV6dmt3ZG9lZWxpd3dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMzg2MDQsImV4cCI6MjA3NDgxNDYwNH0.VZjhi0-tx5EvFwEXUfjCWyMujwbvGrGisSeOdYm0Rnk'
};

// تحميل مكتبة Supabase
const SUPABASE_SCRIPT = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';

class SupabaseSyncManager {
    constructor() {
        this.supabase = null;
        this.isInitialized = false;
        this.isSyncing = false;
        this.lastSyncTime = null;
        this.syncInterval = null;
        this.realtimeSubscriptions = [];
        
        // أسماء الجداول في Supabase
        this.tables = {
            cases: 'legal_cases',
            defendants: 'defendants',
            lawyers: 'lawyers',
            deductions: 'deductions',
            notifications: 'notifications',
            settings: 'app_settings',
            sync_metadata: 'sync_metadata'
        };
    }

    /**
     * تهيئة الاتصال بـ Supabase
     */
    async initialize() {
        try {
            // تحميل مكتبة Supabase إذا لم تكن محملة
            if (typeof supabase === 'undefined') {
                await this.loadSupabaseLibrary();
            }

            // إنشاء عميل Supabase
            this.supabase = window.supabase.createClient(
                SUPABASE_CONFIG.url,
                SUPABASE_CONFIG.anonKey
            );

            this.isInitialized = true;
            console.log('✅ تم تهيئة الاتصال بـ Supabase بنجاح');
            
            // التحقق من وجود الجداول وإنشائها إذا لزم الأمر
            await this.ensureTablesExist();
            
            // تحميل آخر وقت مزامنة
            this.loadLastSyncTime();
            
            return true;
        } catch (error) {
            console.error('❌ خطأ في تهيئة Supabase:', error);
            throw error;
        }
    }

    /**
     * تحميل مكتبة Supabase ديناميكياً
     */
    loadSupabaseLibrary() {
        return new Promise((resolve, reject) => {
            if (window.supabase) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = SUPABASE_SCRIPT;
            script.onload = () => {
                console.log('✅ تم تحميل مكتبة Supabase');
                resolve();
            };
            script.onerror = () => {
                reject(new Error('فشل تحميل مكتبة Supabase'));
            };
            document.head.appendChild(script);
        });
    }

    /**
     * التحقق من وجود الجداول
     */
    async ensureTablesExist() {
        try {
            // ملاحظة: في الإنتاج الحقيقي، يجب إنشاء الجداول من لوحة تحكم Supabase
            // هذه الدالة تتحقق فقط من الوصول إلى الجداول
            const { data, error } = await this.supabase
                .from(this.tables.cases)
                .select('count')
                .limit(1);

            if (error && error.code === '42P01') {
                console.warn('⚠️ الجداول غير موجودة. يجب إنشاؤها من لوحة تحكم Supabase');
                return false;
            }

            return true;
        } catch (error) {
            console.error('خطأ في التحقق من الجداول:', error);
            return false;
        }
    }

    /**
     * مزامنة شاملة - رفع وتنزيل جميع البيانات
     */
    async fullSync(showNotifications = true) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (this.isSyncing) {
            console.warn('⚠️ المزامنة جارية بالفعل');
            return;
        }

        this.isSyncing = true;

        if (showNotifications && window.showNotification) {
            window.showNotification('المزامنة', 'جاري مزامنة البيانات...', 'info');
        }

        try {
            // 1. رفع البيانات المحلية إلى السحابة
            await this.uploadAllData();

            // 2. تنزيل وتحديث البيانات من السحابة
            await this.downloadAllData();

            // 3. تحديث وقت آخر مزامنة
            this.lastSyncTime = new Date().toISOString();
            this.saveLastSyncTime();

            if (showNotifications && window.showNotification) {
                window.showNotification('نجحت المزامنة', 'تم مزامنة جميع البيانات بنجاح', 'success');
            }

            console.log('✅ اكتملت المزامنة الشاملة بنجاح');
            
            // تحديث واجهة المستخدم
            this.refreshUI();

        } catch (error) {
            console.error('❌ خطأ في المزامنة الشاملة:', error);
            
            if (showNotifications && window.showNotification) {
                window.showNotification('خطأ', 'فشلت المزامنة: ' + error.message, 'error');
            }
            
            throw error;
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * رفع جميع البيانات المحلية إلى Supabase
     */
    async uploadAllData() {
        const dataManager = window.dataManager;
        if (!dataManager) {
            throw new Error('DataManager غير متاح');
        }

        console.log('📤 رفع البيانات المحلية...');

        // رفع القضايا
        await this.uploadCases(dataManager.casesData);

        // رفع المدعى عليهم
        await this.uploadDefendants(dataManager.defendantsData);

        // رفع المحامين
        await this.uploadLawyers(dataManager.lawyersData);

        // رفع الاستقطاعات
        await this.uploadDeductions(dataManager.deductionsData);

        // رفع الإشعارات
        await this.uploadNotifications(dataManager.notificationsData);

        // رفع الإعدادات
        await this.uploadSettings(dataManager.settingsData);

        console.log('✅ تم رفع جميع البيانات');
    }

    /**
     * رفع القضايا
     */
    async uploadCases(cases) {
        if (!cases || cases.length === 0) return;

        try {
            for (const caseItem of cases) {
                const caseData = {
                    id: caseItem.id,
                    case_number: caseItem.caseNumber,
                    file_date: caseItem.fileDate,
                    priority: caseItem.priority,
                    status: caseItem.status,
                    subject: caseItem.subject,
                    amount: caseItem.amount,
                    plaintiff_name: caseItem.plaintiffName,
                    plaintiff_phone: caseItem.plaintiffPhone || '',
                    plaintiff_address: caseItem.plaintiffAddress || '',
                    defendant_name: caseItem.defendantName,
                    defendant_address: caseItem.defendantAddress || '',
                    lawyer_name: caseItem.lawyerName || '',
                    court_name: caseItem.courtName,
                    court_section: caseItem.courtSection || '',
                    stage: caseItem.stage,
                    next_hearing: caseItem.nextHearing || null,
                    notes: caseItem.notes || '',
                    documents: JSON.stringify(caseItem.documents || []),
                    execution_options: JSON.stringify(caseItem.executionOptions || []),
                    deductions: caseItem.deductions || 0,
                    timeline: JSON.stringify(caseItem.timeline || []),
                    created_at: caseItem.createdAt,
                    last_update: caseItem.lastUpdate,
                    updated_at: new Date().toISOString()
                };

                // استخدام upsert لإدراج أو تحديث
                const { error } = await this.supabase
                    .from(this.tables.cases)
                    .upsert(caseData, { onConflict: 'id' });

                if (error) {
                    console.error(`خطأ في رفع القضية ${caseItem.caseNumber}:`, error);
                }
            }

            console.log(`✅ تم رفع ${cases.length} قضية`);
        } catch (error) {
            console.error('خطأ في رفع القضايا:', error);
            throw error;
        }
    }

    /**
     * رفع المدعى عليهم
     */
    async uploadDefendants(defendants) {
        if (!defendants || defendants.length === 0) return;

        try {
            for (const defendant of defendants) {
                const defendantData = {
                    id: defendant.id,
                    name: defendant.name,
                    phone: defendant.phone || '',
                    email: defendant.email || '',
                    workplace: defendant.workplace || '',
                    address: defendant.address || '',
                    cases_count: defendant.casesCount || 0,
                    registration_date: defendant.registrationDate,
                    created_at: defendant.createdAt,
                    updated_at: new Date().toISOString()
                };

                const { error } = await this.supabase
                    .from(this.tables.defendants)
                    .upsert(defendantData, { onConflict: 'id' });

                if (error) {
                    console.error(`خطأ في رفع المدعى عليه ${defendant.name}:`, error);
                }
            }

            console.log(`✅ تم رفع ${defendants.length} مدعى عليه`);
        } catch (error) {
            console.error('خطأ في رفع المدعى عليهم:', error);
            throw error;
        }
    }

    /**
     * رفع المحامين
     */
    async uploadLawyers(lawyers) {
        if (!lawyers || lawyers.length === 0) return;

        try {
            for (const lawyer of lawyers) {
                const lawyerData = {
                    id: lawyer.id,
                    name: lawyer.name,
                    license: lawyer.license,
                    phone: lawyer.phone || '',
                    specialization: lawyer.specialization,
                    email: lawyer.email || '',
                    experience: lawyer.experience || 0,
                    address: lawyer.address || '',
                    notes: lawyer.notes || '',
                    cases_count: lawyer.casesCount || 0,
                    registration_date: lawyer.registrationDate,
                    created_at: lawyer.createdAt,
                    updated_at: new Date().toISOString()
                };

                const { error } = await this.supabase
                    .from(this.tables.lawyers)
                    .upsert(lawyerData, { onConflict: 'id' });

                if (error) {
                    console.error(`خطأ في رفع المحامي ${lawyer.name}:`, error);
                }
            }

            console.log(`✅ تم رفع ${lawyers.length} محامي`);
        } catch (error) {
            console.error('خطأ في رفع المحامين:', error);
            throw error;
        }
    }

    /**
     * رفع الاستقطاعات
     */
    async uploadDeductions(deductions) {
        if (!deductions || deductions.length === 0) return;

        try {
            for (const deduction of deductions) {
                const deductionData = {
                    id: deduction.id,
                    plaintiff_name: deduction.plaintiffName,
                    case_number: deduction.caseNumber,
                    amount: deduction.amount,
                    date: deduction.date,
                    source: deduction.source,
                    notes: deduction.notes || '',
                    status: deduction.status,
                    created_at: deduction.createdAt,
                    updated_at: new Date().toISOString()
                };

                const { error } = await this.supabase
                    .from(this.tables.deductions)
                    .upsert(deductionData, { onConflict: 'id' });

                if (error) {
                    console.error(`خطأ في رفع الاستقطاع ${deduction.id}:`, error);
                }
            }

            console.log(`✅ تم رفع ${deductions.length} استقطاع`);
        } catch (error) {
            console.error('خطأ في رفع الاستقطاعات:', error);
            throw error;
        }
    }

    /**
     * رفع الإشعارات
     */
    async uploadNotifications(notifications) {
        if (!notifications || notifications.length === 0) return;

        try {
            // رفع آخر 50 إشعار فقط
            const recentNotifications = notifications.slice(0, 50);

            for (const notification of recentNotifications) {
                const notificationData = {
                    id: notification.id,
                    title: notification.title,
                    message: notification.message,
                    type: notification.type,
                    read: notification.read || false,
                    created_at: notification.createdAt,
                    updated_at: new Date().toISOString()
                };

                const { error } = await this.supabase
                    .from(this.tables.notifications)
                    .upsert(notificationData, { onConflict: 'id' });

                if (error) {
                    console.error(`خطأ في رفع الإشعار ${notification.id}:`, error);
                }
            }

            console.log(`✅ تم رفع ${recentNotifications.length} إشعار`);
        } catch (error) {
            console.error('خطأ في رفع الإشعارات:', error);
            throw error;
        }
    }

    /**
     * رفع الإعدادات
     */
    async uploadSettings(settings) {
        if (!settings) return;

        try {
            const settingsData = {
                id: 1, // معرف ثابت للإعدادات
                settings_json: JSON.stringify(settings),
                updated_at: new Date().toISOString()
            };

            const { error } = await this.supabase
                .from(this.tables.settings)
                .upsert(settingsData, { onConflict: 'id' });

            if (error) {
                console.error('خطأ في رفع الإعدادات:', error);
            } else {
                console.log('✅ تم رفع الإعدادات');
            }
        } catch (error) {
            console.error('خطأ في رفع الإعدادات:', error);
            throw error;
        }
    }

    /**
     * تنزيل جميع البيانات من Supabase ودمجها مع البيانات المحلية
     */
    async downloadAllData() {
        const dataManager = window.dataManager;
        if (!dataManager) {
            throw new Error('DataManager غير متاح');
        }

        console.log('📥 تنزيل البيانات من السحابة...');

        try {
            // تنزيل القضايا
            const cases = await this.downloadCases();
            dataManager.casesData = this.mergeData(dataManager.casesData, cases, 'id');
            dataManager.filteredCases = [...dataManager.casesData];

            // تنزيل المدعى عليهم
            const defendants = await this.downloadDefendants();
            dataManager.defendantsData = this.mergeData(dataManager.defendantsData, defendants, 'id');
            dataManager.filteredDefendants = [...dataManager.defendantsData];

            // تنزيل المحامين
            const lawyers = await this.downloadLawyers();
            dataManager.lawyersData = this.mergeData(dataManager.lawyersData, lawyers, 'id');
            dataManager.filteredLawyers = [...dataManager.lawyersData];

            // تنزيل الاستقطاعات
            const deductions = await this.downloadDeductions();
            dataManager.deductionsData = this.mergeData(dataManager.deductionsData, deductions, 'id');
            dataManager.filteredDeductions = [...dataManager.deductionsData];

            // تنزيل الإشعارات
            const notifications = await this.downloadNotifications();
            dataManager.notificationsData = this.mergeData(dataManager.notificationsData, notifications, 'id');

            // تنزيل الإعدادات
            const settings = await this.downloadSettings();
            if (settings) {
                dataManager.settingsData = { ...dataManager.settingsData, ...settings };
            }

            // حفظ البيانات المحدثة
            dataManager.saveData();

            console.log('✅ تم تنزيل ودمج جميع البيانات');
        } catch (error) {
            console.error('خطأ في تنزيل البيانات:', error);
            throw error;
        }
    }

    /**
     * تنزيل القضايا
     */
    async downloadCases() {
        try {
            const { data, error } = await this.supabase
                .from(this.tables.cases)
                .select('*')
                .order('updated_at', { ascending: false });

            if (error) throw error;

            return (data || []).map(item => ({
                id: item.id,
                caseNumber: item.case_number,
                fileDate: item.file_date,
                priority: item.priority,
                status: item.status,
                subject: item.subject,
                amount: item.amount,
                plaintiffName: item.plaintiff_name,
                plaintiffPhone: item.plaintiff_phone,
                plaintiffAddress: item.plaintiff_address,
                defendantName: item.defendant_name,
                defendantAddress: item.defendant_address,
                lawyerName: item.lawyer_name,
                courtName: item.court_name,
                courtSection: item.court_section,
                stage: item.stage,
                nextHearing: item.next_hearing,
                notes: item.notes,
                documents: JSON.parse(item.documents || '[]'),
                executionOptions: JSON.parse(item.execution_options || '[]'),
                deductions: item.deductions,
                timeline: JSON.parse(item.timeline || '[]'),
                createdAt: item.created_at,
                lastUpdate: item.last_update
            }));
        } catch (error) {
            console.error('خطأ في تنزيل القضايا:', error);
            return [];
        }
    }

    /**
     * تنزيل المدعى عليهم
     */
    async downloadDefendants() {
        try {
            const { data, error } = await this.supabase
                .from(this.tables.defendants)
                .select('*')
                .order('updated_at', { ascending: false });

            if (error) throw error;

            return (data || []).map(item => ({
                id: item.id,
                name: item.name,
                phone: item.phone,
                email: item.email,
                workplace: item.workplace,
                address: item.address,
                casesCount: item.cases_count,
                registrationDate: item.registration_date,
                createdAt: item.created_at
            }));
        } catch (error) {
            console.error('خطأ في تنزيل المدعى عليهم:', error);
            return [];
        }
    }

    /**
     * تنزيل المحامين
     */
    async downloadLawyers() {
        try {
            const { data, error } = await this.supabase
                .from(this.tables.lawyers)
                .select('*')
                .order('updated_at', { ascending: false });

            if (error) throw error;

            return (data || []).map(item => ({
                id: item.id,
                name: item.name,
                license: item.license,
                phone: item.phone,
                specialization: item.specialization,
                email: item.email,
                experience: item.experience,
                address: item.address,
                notes: item.notes,
                casesCount: item.cases_count,
                registrationDate: item.registration_date,
                createdAt: item.created_at
            }));
        } catch (error) {
            console.error('خطأ في تنزيل المحامين:', error);
            return [];
        }
    }

    /**
     * تنزيل الاستقطاعات
     */
    async downloadDeductions() {
        try {
            const { data, error } = await this.supabase
                .from(this.tables.deductions)
                .select('*')
                .order('updated_at', { ascending: false });

            if (error) throw error;

            return (data || []).map(item => ({
                id: item.id,
                plaintiffName: item.plaintiff_name,
                caseNumber: item.case_number,
                amount: item.amount,
                date: item.date,
                source: item.source,
                notes: item.notes,
                status: item.status,
                createdAt: item.created_at
            }));
        } catch (error) {
            console.error('خطأ في تنزيل الاستقطاعات:', error);
            return [];
        }
    }

    /**
     * تنزيل الإشعارات
     */
    async downloadNotifications() {
        try {
            const { data, error } = await this.supabase
                .from(this.tables.notifications)
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            return (data || []).map(item => ({
                id: item.id,
                title: item.title,
                message: item.message,
                type: item.type,
                read: item.read,
                createdAt: item.created_at
            }));
        } catch (error) {
            console.error('خطأ في تنزيل الإشعارات:', error);
            return [];
        }
    }

    /**
     * تنزيل الإعدادات
     */
    async downloadSettings() {
        try {
            const { data, error } = await this.supabase
                .from(this.tables.settings)
                .select('settings_json')
                .eq('id', 1)
                .single();

            if (error) throw error;

            return data ? JSON.parse(data.settings_json) : null;
        } catch (error) {
            console.error('خطأ في تنزيل الإعدادات:', error);
            return null;
        }
    }

    /**
     * دمج البيانات المحلية مع البيانات السحابية
     */
    mergeData(localData, cloudData, idField = 'id') {
        // إنشاء خريطة للبيانات المحلية
        const localMap = new Map(localData.map(item => [item[idField], item]));

        // إضافة أو تحديث البيانات من السحابة
        cloudData.forEach(cloudItem => {
            const id = cloudItem[idField];
            const localItem = localMap.get(id);

            if (!localItem) {
                // عنصر جديد من السحابة
                localMap.set(id, cloudItem);
            } else {
                // مقارنة التواريخ واختيار الأحدث
                const cloudDate = new Date(cloudItem.lastUpdate || cloudItem.createdAt || 0);
                const localDate = new Date(localItem.lastUpdate || localItem.createdAt || 0);

                if (cloudDate > localDate) {
                    localMap.set(id, cloudItem);
                }
            }
        });

        return Array.from(localMap.values());
    }

    /**
     * تفعيل المزامنة التلقائية
     */
    enableAutoSync(intervalMinutes = 5) {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        this.syncInterval = setInterval(() => {
            console.log('🔄 مزامنة تلقائية...');
            this.fullSync(false).catch(error => {
                console.error('خطأ في المزامنة التلقائية:', error);
            });
        }, intervalMinutes * 60 * 1000);

        console.log(`✅ تم تفعيل المزامنة التلقائية كل ${intervalMinutes} دقائق`);
    }

    /**
     * إيقاف المزامنة التلقائية
     */
    disableAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('⏸️ تم إيقاف المزامنة التلقائية');
        }
    }

    /**
     * تفعيل المزامنة في الوقت الحقيقي
     */
    enableRealtimeSync() {
        if (!this.isInitialized) {
            console.error('يجب تهيئة Supabase أولاً');
            return;
        }

        // الاشتراك في تغييرات القضايا
        const casesSubscription = this.supabase
            .channel('cases_changes')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: this.tables.cases },
                (payload) => this.handleRealtimeChange('cases', payload)
            )
            .subscribe();

        // الاشتراك في تغييرات المدعى عليهم
        const defendantsSubscription = this.supabase
            .channel('defendants_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: this.tables.defendants },
                (payload) => this.handleRealtimeChange('defendants', payload)
            )
            .subscribe();

        // الاشتراك في تغييرات المحامين
        const lawyersSubscription = this.supabase
            .channel('lawyers_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: this.tables.lawyers },
                (payload) => this.handleRealtimeChange('lawyers', payload)
            )
            .subscribe();

        // الاشتراك في تغييرات الاستقطاعات
        const deductionsSubscription = this.supabase
            .channel('deductions_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: this.tables.deductions },
                (payload) => this.handleRealtimeChange('deductions', payload)
            )
            .subscribe();

        this.realtimeSubscriptions = [
            casesSubscription,
            defendantsSubscription,
            lawyersSubscription,
            deductionsSubscription
        ];

        console.log('✅ تم تفعيل المزامنة في الوقت الحقيقي');
    }

    /**
     * معالجة التغييرات في الوقت الحقيقي
     */
    handleRealtimeChange(dataType, payload) {
        console.log(`🔄 تغيير في الوقت الحقيقي: ${dataType}`, payload);

        const dataManager = window.dataManager;
        if (!dataManager) return;

        // تحديث البيانات حسب النوع
        switch (payload.eventType) {
            case 'INSERT':
            case 'UPDATE':
                this.downloadAllData().then(() => this.refreshUI());
                break;
            case 'DELETE':
                this.downloadAllData().then(() => this.refreshUI());
                break;
        }
    }

    /**
     * إيقاف المزامنة في الوقت الحقيقي
     */
    disableRealtimeSync() {
        this.realtimeSubscriptions.forEach(subscription => {
            subscription.unsubscribe();
        });
        this.realtimeSubscriptions = [];
        console.log('⏸️ تم إيقاف المزامنة في الوقت الحقيقي');
    }

    /**
     * تحديث واجهة المستخدم بعد المزامنة
     */
    refreshUI() {
        if (typeof renderCasesTable === 'function') renderCasesTable();
        if (typeof renderDefendantsTable === 'function') renderDefendantsTable();
        if (typeof renderLawyersTable === 'function') renderLawyersTable();
        if (typeof renderDeductionsTable === 'function') renderDeductionsTable();
        if (typeof updateDashboardStats === 'function') updateDashboardStats();
        if (typeof renderUpcomingHearings === 'function') renderUpcomingHearings();
        if (typeof renderAlerts === 'function') renderAlerts();
    }

    /**
     * حفظ وقت آخر مزامنة
     */
    saveLastSyncTime() {
        if (this.lastSyncTime) {
            localStorage.setItem('lastSyncTime', this.lastSyncTime);
        }
    }

    /**
     * تحميل وقت آخر مزامنة
     */
    loadLastSyncTime() {
        const savedTime = localStorage.getItem('lastSyncTime');
        if (savedTime) {
            this.lastSyncTime = savedTime;
        }
    }

    /**
     * الحصول على معلومات حالة المزامنة
     */
    getSyncStatus() {
        return {
            isInitialized: this.isInitialized,
            isSyncing: this.isSyncing,
            lastSyncTime: this.lastSyncTime,
            autoSyncEnabled: this.syncInterval !== null,
            realtimeSyncEnabled: this.realtimeSubscriptions.length > 0
        };
    }
}

// إنشاء نسخة عامة من مدير المزامنة
window.supabaseSyncManager = new SupabaseSyncManager();

// تهيئة تلقائية عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await window.supabaseSyncManager.initialize();
        console.log('✅ مدير المزامنة Supabase جاهز');
        
        // إضافة زر المزامنة إلى الواجهة
        addSyncButton();
    } catch (error) {
        console.error('خطأ في تهيئة مدير المزامنة:', error);
    }
});

/**
 * إضافة زر المزامنة إلى واجهة المستخدم
 */
function addSyncButton() {
    const headerRight = document.querySelector('.header-right');
    if (!headerRight) return;

    const syncButton = document.createElement('button');
    syncButton.className = 'btn btn-success';
    syncButton.innerHTML = '<i class="fas fa-sync-alt"></i> مزامنة';
    syncButton.style.marginLeft = '1rem';
    syncButton.onclick = async () => {
        syncButton.disabled = true;
        syncButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري المزامنة...';
        
        try {
            await window.supabaseSyncManager.fullSync();
        } catch (error) {
            console.error('خطأ في المزامنة:', error);
        } finally {
            syncButton.disabled = false;
            syncButton.innerHTML = '<i class="fas fa-sync-alt"></i> مزامنة';
        }
    };

    headerRight.insertBefore(syncButton, headerRight.firstChild);
}

console.log('📦 تم تحميل نظام المزامنة Supabase');
