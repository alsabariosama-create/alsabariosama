// supabase-sync-complete.js
// نظام المزامنة الكاملة مع Supabase

class SupabaseSyncComplete {
    constructor() {
        this.supabaseUrl = 'https://dopzopezvkwdoeeliwwd.supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcHpvcGV6dmt3ZG9lZWxpd3dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMzg2MDQsImV4cCI6MjA3NDgxNDYwNH0.VZjhi0-tx5EvFwEXUfjCWyMujwbvGrGisSeOdYm0Rnk';

        this.userId = this.getUserId();
        this.isSyncing = false;
        this.lastSyncTime = localStorage.getItem('lastSyncTime') || null;

        this.loadSupabaseClient().then(() => {
            // مزامنة تلقائية عند تحميل التطبيق
            this.autoSyncOnLoad();
            // إضافة مؤشر حالة المزامنة
            this.addSyncStatusIndicator();
        });
    }

    // إضافة مؤشر حالة المزامنة
    addSyncStatusIndicator() {
        // إضافة مؤشر في الهيدر
        const headerRight = document.querySelector('.header-right');
        if (headerRight && !document.getElementById('sync-status-indicator')) {
            const indicator = document.createElement('div');
            indicator.id = 'sync-status-indicator';
            indicator.style.cssText = `
                padding: 0.5rem 1rem;
                border-radius: 20px;
                font-size: 0.75rem;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                cursor: pointer;
                transition: all 0.3s ease;
                background: var(--gray-100);
                color: var(--gray-600);
            `;
            indicator.innerHTML = '<i class="fas fa-sync-alt"></i><span>جاري التحميل...</span>';
            indicator.onclick = () => this.showSyncStatusDetails();

            headerRight.insertBefore(indicator, headerRight.firstChild);

            // تحديث الحالة كل 5 ثوانِ
            setInterval(() => this.updateSyncStatusIndicator(), 5000);
        }
    }

    // تحديث مؤشر حالة المزامنة
    updateSyncStatusIndicator() {
        const indicator = document.getElementById('sync-status-indicator');
        if (!indicator) return;

        const hasLocalData = this.checkForLocalData();
        const isOnline = navigator.onLine;

        if (this.isSyncing) {
            indicator.style.background = 'var(--warning-yellow-light)';
            indicator.style.color = 'var(--warning-yellow)';
            indicator.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i><span>جاري المزامنة...</span>';
        } else if (!isOnline) {
            indicator.style.background = 'var(--error-red-light)';
            indicator.style.color = 'var(--error-red)';
            indicator.innerHTML = '<i class="fas fa-wifi-slash"></i><span>غير متصل</span>';
        } else if (hasLocalData) {
            indicator.style.background = 'var(--success-green-light)';
            indicator.style.color = 'var(--success-green)';
            indicator.innerHTML = '<i class="fas fa-check-circle"></i><span>متزامن</span>';
        } else {
            indicator.style.background = 'var(--primary-blue-light)';
            indicator.style.color = 'var(--primary-blue)';
            indicator.innerHTML = '<i class="fas fa-cloud-download-alt"></i><span>بحاجة للتحميل</span>';
        }
    }

    // إظهار تفاصيل حالة المزامنة
    showSyncStatusDetails() {
        const hasLocalData = this.checkForLocalData();
        const status = this.getSyncStatus();

        const content = `
            <div style="padding: 1rem;">
                <div style="display: grid; gap: 1rem; margin-bottom: 2rem;">
                    <div style="display: flex; justify-content: space-between; padding: 0.75rem; background: var(--gray-50); border-radius: 0.5rem;">
                        <span>حالة الاتصال:</span>
                        <strong style="color: ${navigator.onLine ? 'var(--success-green)' : 'var(--error-red)'};">
                            ${navigator.onLine ? 'متصل' : 'غير متصل'}
                        </strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.75rem; background: var(--gray-50); border-radius: 0.5rem;">
                        <span>البيانات المحلية:</span>
                        <strong style="color: ${hasLocalData ? 'var(--success-green)' : 'var(--warning-yellow)'};">
                            ${hasLocalData ? 'موجودة' : 'غير موجودة'}
                        </strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.75rem; background: var(--gray-50); border-radius: 0.5rem;">
                        <span>حالة المزامنة:</span>
                        <strong style="color: ${this.isSyncing ? 'var(--warning-yellow)' : 'var(--success-green)'};">
                            ${this.isSyncing ? 'جاري المزامنة' : 'جاهز'}
                        </strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.75rem; background: var(--gray-50); border-radius: 0.5rem;">
                        <span>آخر مزامنة:</span>
                        <strong>
                            ${status.lastSyncTime ? new Date(status.lastSyncTime).toLocaleString('ar-SA') : 'لم تتم'}
                        </strong>
                    </div>
                </div>
                
                <div style="display: grid; gap: 1rem;">
                    <button class="btn btn-primary" onclick="window.supabaseSync.syncAll(); closeModal(this);">
                        <i class="fas fa-sync-alt"></i>
                        مزامنة الآن
                    </button>
                    ${!hasLocalData ? `
                    <button class="btn btn-secondary" onclick="retryDataDownload(); closeModal(this);">
                        <i class="fas fa-cloud-download-alt"></i>
                        تحميل البيانات
                    </button>
                    ` : ''}
                </div>
            </div>
        `;

        if (typeof createModal === 'function') {
            createModal('حالة المزامنة', content);
        }
    }

    async loadSupabaseClient() {
        if (window.supabase) {
            this.initializeClient();
            return;
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = () => {
                this.initializeClient();
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    initializeClient() {
        this.supabase = window.supabase.createClient(this.supabaseUrl, this.supabaseKey);
        console.log('✓ تم الاتصال بـ Supabase');
    }

    getUserId() {
        let userId = localStorage.getItem('syncUserId');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('syncUserId', userId);
        }
        return userId;
    }

    // التحقق من حالة الاتصال وقاعدة البيانات
    async checkConnectionAndData() {
        try {
            console.log('🔍 فحص حالة الاتصال وقاعدة البيانات...');

            if (!this.supabase) {
                await this.loadSupabaseClient();
            }

            const { data, error } = await this.supabase
                .from('cases')
                .select('*')
                .limit(100);

            if (error) {
                console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error);
                return false;
            }

            console.log('✅ الاتصال بقاعدة البيانات يعمل بشكل صحيح');
            return true;
        } catch (error) {
            console.error('❌ خطأ في فحص الاتصال:', error);
            return false;
        }
    }

    // دالة لإعادة المحاولة التلقائية
    async retryDownload(maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 المحاولة ${attempt} من ${maxRetries} لتحميل البيانات...`);

                const connectionOk = await this.checkConnectionAndData();
                if (!connectionOk) {
                    throw new Error('فشل الاتصال بقاعدة البيانات');
                }

                await this.downloadAllData();
                this.refreshUI();

                console.log(`✅ نجحت المحاولة ${attempt} - تم تحميل البيانات`);
                return true;

            } catch (error) {
                console.error(`❌ فشلت المحاولة ${attempt}:`, error);

                if (attempt < maxRetries) {
                    const delay = attempt * 2000; // تأخير متزايد
                    console.log(`⏳ انتظار ${delay / 1000} ثانية قبل المحاولة التالية...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    console.error('❌ فشلت جميع المحاولات');
                    this.showRetryDialog();
                    return false;
                }
            }
        }
    }

    // إظهار حوار إعادة المحاولة
    showRetryDialog() {
        if (typeof createModal === 'function') {
            const content = `
                <div style="text-align: center; padding: 2rem;">
                    <div style="font-size: 3rem; color: var(--warning-yellow); margin-bottom: 1rem;">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3 style="margin-bottom: 1rem; color: var(--gray-900);">فشل تحميل البيانات</h3>
                    <p style="color: var(--gray-600); margin-bottom: 2rem; line-height: 1.6;">
                        لم نتمكن من تحميل البيانات من السحابة. يرجى التحقق من:
                    </p>
                    <ul style="text-align: right; color: var(--gray-600); margin-bottom: 2rem; line-height: 1.8;">
                        <li>الاتصال بالإنترنت</li>
                        <li>حالة خادم قاعدة البيانات</li>
                        <li>صحة معرف المستخدم</li>
                    </ul>
                    <div style="display: grid; gap: 1rem;">
                        <button class="btn btn-primary" onclick="retryDataDownload()">
                            <i class="fas fa-sync-alt"></i>
                            إعادة المحاولة
                        </button>
                        <button class="btn btn-secondary" onclick="closeModal(this)">
                            <i class="fas fa-times"></i>
                            إغلاق
                        </button>
                    </div>
                </div>
            `;

            createModal('فشل تحميل البيانات', content);
        } else {
            console.log('⚠️ فشل تحميل البيانات - يرجى إعادة تحميل الصفحة');
        }
    }

    // مزامنة تلقائية عند تحميل التطبيق
    async autoSyncOnLoad() {
        try {
            console.log('🔄 بدء المزامنة التلقائية...');

            // تأخير قصير للتأكد من تحميل التطبيق بالكامل
            await new Promise(resolve => setTimeout(resolve, 1000));

            // تحقق من وجود اتصال بالإنترنت
            if (!navigator.onLine) {
                console.log('❌ لا يوجد اتصال بالإنترنت - تم تخطي المزامنة التلقائية');
                this.showOfflineMessage();
                return;
            }

            // التحقق من وجود بيانات محلية
            const hasLocalData = this.checkForLocalData();
            console.log('📊 وجود بيانات محلية:', hasLocalData);

            if (!hasLocalData) {
                // إذا لم توجد بيانات محلية، قم بالتحميل من السحابة مع إعادة المحاولة
                console.log('📥 لا توجد بيانات محلية - تحميل من السحابة...');
                const success = await this.retryDownload();
                if (success) {
                    this.refreshUI();
                    console.log('✅ تم تحميل البيانات من السحابة بنجاح');
                }
            } else {
                // إذا وجدت بيانات محلية، قم بالمزامنة الكاملة
                console.log('🔄 وجدت بيانات محلية - بدء المزامنة الكاملة...');
                await this.syncAllSilent();
            }

        } catch (error) {
            console.error('خطأ في المزامنة التلقائية:', error);
            // في حالة الخطأ، حاول التحميل من السحابة على الأقل
            try {
                console.log('🔄 محاولة التحميل من السحابة كحل بديل...');
                await this.retryDownload(2); // محاولتين فقط كحل بديل
            } catch (fallbackError) {
                console.error('خطأ في التحميل الاحتياطي:', fallbackError);
                this.showRetryDialog();
            }
        }
    }

    // إظهار رسالة عدم الاتصال
    showOfflineMessage() {
        if (typeof showNotification === 'function') {
            showNotification('لا يوجد اتصال', 'يرجى التحقق من الاتصال بالإنترنت للمزامنة', 'warning');
        }
    }

    // فحص وجود بيانات محلية
    checkForLocalData() {
        try {
            // تحقق من وجود dataManager وبياناته
            if (!window.dataManager) {
                console.log('❌ dataManager غير متوفر');
                return false;
            }

            const casesCount = (window.dataManager.casesData || []).length;
            const defendantsCount = (window.dataManager.defendantsData || []).length;
            const lawyersCount = (window.dataManager.lawyersData || []).length;
            const deductionsCount = (window.dataManager.deductionsData || []).length;

            const totalData = casesCount + defendantsCount + lawyersCount + deductionsCount;

            console.log('📊 إحصائيات البيانات المحلية:', {
                cases: casesCount,
                defendants: defendantsCount,
                lawyers: lawyersCount,
                deductions: deductionsCount,
                total: totalData
            });

            return totalData > 0;
        } catch (error) {
            console.error('خطأ في فحص البيانات المحلية:', error);
            return false;
        }
    }

    // مزامنة صامتة (بدون واجهة المستخدم)
    async syncAllSilent() {
        if (this.isSyncing) return;

        this.isSyncing = true;

        try {
            console.log('🔄 جاري المزامنة الصامتة...');

            // 1. رفع البيانات المحلية أولاً
            await this.uploadCases();
            await this.uploadDefendants();
            await this.uploadLawyers();
            await this.uploadDeductions();
            await this.uploadSettings();

            // 2. تحميل جميع البيانات من السحابة (واستبدال المحلية)
            await this.downloadAllData();

            // 3. تحديث وقت المزامنة
            this.lastSyncTime = new Date().toISOString();
            localStorage.setItem('lastSyncTime', this.lastSyncTime);

            // تحديث الواجهة
            this.refreshUI();

            console.log('✅ اكتملت المزامنة التلقائية بنجاح');

        } catch (error) {
            console.error('خطأ في المزامنة الصامتة:', error);
        } finally {
            this.isSyncing = false;
        }
    }

    // ====== المزامنة الكاملة ======
    async syncAll() {
        if (this.isSyncing) {
            showNotification('تنبيه', 'المزامنة قيد التشغيل بالفعل', 'warning');
            return { success: false, message: 'جاري المزامنة' };
        }

        this.isSyncing = true;
        const progressDiv = this.showSyncProgress();

        try {
            this.updateProgress(progressDiv, 'جاري الاتصال بالسحابة...', 10);

            if (!this.supabase) {
                await this.loadSupabaseClient();
            }

            // 1. رفع جميع البيانات المحلية
            this.updateProgress(progressDiv, 'رفع القضايا...', 20);
            await this.uploadCases();

            this.updateProgress(progressDiv, 'رفع المدعى عليهم...', 35);
            await this.uploadDefendants();

            this.updateProgress(progressDiv, 'رفع المحامين...', 50);
            await this.uploadLawyers();

            this.updateProgress(progressDiv, 'رفع الاستقطاعات...', 65);
            await this.uploadDeductions();

            this.updateProgress(progressDiv, 'رفع الإعدادات...', 75);
            await this.uploadSettings();

            // 2. تحميل جميع البيانات من السحابة
            this.updateProgress(progressDiv, 'تحميل البيانات من السحابة...', 80);
            await this.downloadAllData();

            // 3. تحديث وقت المزامنة
            this.lastSyncTime = new Date().toISOString();
            localStorage.setItem('lastSyncTime', this.lastSyncTime);

            this.updateProgress(progressDiv, 'اكتملت المزامنة!', 100);

            setTimeout(() => {
                this.closeSyncProgress(progressDiv);
                showNotification('نجحت المزامنة', 'تم مزامنة جميع البيانات بنجاح ✓', 'success');
            }, 1000);

            // تحديث الواجهة
            this.refreshUI();

            this.isSyncing = false;
            return { success: true, message: 'تمت المزامنة بنجاح' };

        } catch (error) {
            console.error('خطأ في المزامنة:', error);
            this.closeSyncProgress(progressDiv);
            showNotification('خطأ', 'فشلت المزامنة: ' + error.message, 'error');
            this.isSyncing = false;
            return { success: false, message: error.message };
        }
    }

    // ====== رفع البيانات ======
    async uploadCases() {
        const cases = dataManager.casesData || [];

        for (const caseItem of cases) {
            try {
                await this.supabase
                    .from('cases')
                    .upsert({
                        id: caseItem.id,
                        user_id: this.userId,
                        data: caseItem,
                        updated_at: new Date().toISOString()
                    });
            } catch (error) {
                console.error('خطأ في رفع القضية:', error);
            }
        }

        console.log(`✓ تم رفع ${cases.length} قضية`);
    }

    async uploadDefendants() {
        const defendants = dataManager.defendantsData || [];

        for (const defendant of defendants) {
            try {
                await this.supabase
                    .from('defendants')
                    .upsert({
                        id: defendant.id,
                        user_id: this.userId,
                        data: defendant,
                        updated_at: new Date().toISOString()
                    });
            } catch (error) {
                console.error('خطأ في رفع المدعى عليه:', error);
            }
        }

        console.log(`✓ تم رفع ${defendants.length} مدعى عليه`);
    }

    async uploadLawyers() {
        const lawyers = dataManager.lawyersData || [];

        for (const lawyer of lawyers) {
            try {
                await this.supabase
                    .from('lawyers')
                    .upsert({
                        id: lawyer.id,
                        user_id: this.userId,
                        data: lawyer,
                        updated_at: new Date().toISOString()
                    });
            } catch (error) {
                console.error('خطأ في رفع المحامي:', error);
            }
        }

        console.log(`✓ تم رفع ${lawyers.length} محامي`);
    }

    async uploadDeductions() {
        const deductions = dataManager.deductionsData || [];

        for (const deduction of deductions) {
            try {
                await this.supabase
                    .from('deductions')
                    .upsert({
                        id: deduction.id,
                        user_id: this.userId,
                        data: deduction,
                        updated_at: new Date().toISOString()
                    });
            } catch (error) {
                console.error('خطأ في رفع الاستقطاع:', error);
            }
        }

        console.log(`✓ تم رفع ${deductions.length} استقطاع`);
    }

    async uploadSettings() {
        await this.supabase
            .from('settings')
            .upsert({
                user_id: this.userId,
                data: dataManager.settingsData || {},
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            });

        console.log('✓ تم رفع الإعدادات');
    }

    // ====== تحميل البيانات ======
    async downloadAllData() {
        console.log('🔄 جاري تحميل البيانات من السحابة...');

        try {
            // التحقق من الاتصال بقاعدة البيانات
            if (!this.supabase) {
                console.log('🔄 إعادة تهيئة الاتصال بـ Supabase...');
                await this.loadSupabaseClient();
            }

            let totalDownloaded = 0;

            // تحميل القضايا
            console.log('📁 تحميل القضايا...');
            const { data: cases, error: casesError } = await this.supabase
                .from('cases')
                .select('data')
                .eq('user_id', this.userId);

            if (casesError) {
                console.error('خطأ في تحميل القضايا:', casesError);
            } else {
                window.dataManager.casesData = cases ? cases.map(c => c.data) : [];
                window.dataManager.filteredCases = [...window.dataManager.casesData];
                totalDownloaded += window.dataManager.casesData.length;
                console.log(`✅ تم تحميل ${window.dataManager.casesData.length} قضية`);
            }

            // تحميل المدعى عليهم
            console.log('👥 تحميل المدعى عليهم...');
            const { data: defendants, error: defendantsError } = await this.supabase
                .from('defendants')
                .select('data')
                .eq('user_id', this.userId);

            if (defendantsError) {
                console.error('خطأ في تحميل المدعى عليهم:', defendantsError);
            } else {
                window.dataManager.defendantsData = defendants ? defendants.map(d => d.data) : [];
                window.dataManager.filteredDefendants = [...window.dataManager.defendantsData];
                totalDownloaded += window.dataManager.defendantsData.length;
                console.log(`✅ تم تحميل ${window.dataManager.defendantsData.length} مدعى عليه`);
            }

            // تحميل المحامين
            console.log('⚖️ تحميل المحامين...');
            const { data: lawyers, error: lawyersError } = await this.supabase
                .from('lawyers')
                .select('data')
                .eq('user_id', this.userId);

            if (lawyersError) {
                console.error('خطأ في تحميل المحامين:', lawyersError);
            } else {
                window.dataManager.lawyersData = lawyers ? lawyers.map(l => l.data) : [];
                window.dataManager.filteredLawyers = [...window.dataManager.lawyersData];
                totalDownloaded += window.dataManager.lawyersData.length;
                console.log(`✅ تم تحميل ${window.dataManager.lawyersData.length} محامي`);
            }

            // تحميل الاستقطاعات
            console.log('💰 تحميل الاستقطاعات...');
            const { data: deductions, error: deductionsError } = await this.supabase
                .from('deductions')
                .select('data')
                .eq('user_id', this.userId);

            if (deductionsError) {
                console.error('خطأ في تحميل الاستقطاعات:', deductionsError);
            } else {
                window.dataManager.deductionsData = deductions ? deductions.map(d => d.data) : [];
                window.dataManager.filteredDeductions = [...window.dataManager.deductionsData];
                totalDownloaded += window.dataManager.deductionsData.length;
                console.log(`✅ تم تحميل ${window.dataManager.deductionsData.length} استقطاع`);
            }

            // تحميل الإعدادات
            console.log('⚙️ تحميل الإعدادات...');
            const { data: settings, error: settingsError } = await this.supabase
                .from('settings')
                .select('data')
                .eq('user_id', this.userId)
                .single();

            if (settingsError && settingsError.code !== 'PGRST116') {
                console.error('خطأ في تحميل الإعدادات:', settingsError);
            } else if (settings) {
                window.dataManager.settingsData = settings.data || {};
                console.log('✅ تم تحميل الإعدادات');
            } else {
                console.log('ℹ️ لم يتم العثور على إعدادات مخزنة');
                window.dataManager.settingsData = {};
            }

            // حفظ البيانات محلياً
            console.log('💾 حفظ البيانات محلياً...');
            await window.dataManager.saveData();

            console.log(`✅ اكتمل التحميل - إجمالي العناصر المحملة: ${totalDownloaded}`);

            // إظهار إشعار للمستخدم إذا تم تحميل بيانات
            if (totalDownloaded > 0) {
                this.showSuccessMessage(`تم تحميل ${totalDownloaded} عنصر من السحابة`);
            } else {
                console.log('ℹ️ لا توجد بيانات مخزنة في السحابة لهذا المستخدم');
            }

        } catch (error) {
            console.error('❌ خطأ عام في تحميل البيانات:', error);
            throw error;
        }
    }

    // عرض رسالة نجاح للمستخدم
    showSuccessMessage(message) {
        if (typeof showNotification === 'function') {
            showNotification('تم التحميل', message, 'success');
        } else {
            console.log('✅ ' + message);
        }
    }

    // ====== تحميل فقط (للجهاز الجديد) ======
    async downloadOnly() {
        if (this.isSyncing) {
            showNotification('تنبيه', 'المزامنة قيد التشغيل بالفعل', 'warning');
            return { success: false };
        }

        this.isSyncing = true;
        const progressDiv = this.showSyncProgress();

        try {
            this.updateProgress(progressDiv, 'جاري الاتصال بالسحابة...', 10);

            if (!this.supabase) {
                await this.loadSupabaseClient();
            }

            this.updateProgress(progressDiv, 'تحميل جميع البيانات...', 50);

            // إعادة تعيين البيانات المحلية قبل التحميل
            dataManager.casesData = [];
            dataManager.defendantsData = [];
            dataManager.lawyersData = [];
            dataManager.deductionsData = [];
            dataManager.settingsData = {};

            await this.downloadAllData();

            this.updateProgress(progressDiv, 'اكتمل التحميل!', 100);

            setTimeout(() => {
                this.closeSyncProgress(progressDiv);
                showNotification('نجح التحميل', 'تم تحميل جميع البيانات من السحابة ✓', 'success');
            }, 1000);

            this.refreshUI();

            this.isSyncing = false;
            return { success: true };

        } catch (error) {
            console.error('خطأ في التحميل:', error);
            this.closeSyncProgress(progressDiv);
            showNotification('خطأ', 'فشل التحميل: ' + error.message, 'error');
            this.isSyncing = false;
            return { success: false };
        }
    }

    // ====== رفع فقط (نسخ احتياطي) ======
    async uploadOnly() {
        if (this.isSyncing) {
            showNotification('تنبيه', 'المزامنة قيد التشغيل بالفعل', 'warning');
            return { success: false };
        }

        this.isSyncing = true;
        const progressDiv = this.showSyncProgress();

        try {
            this.updateProgress(progressDiv, 'جاري الاتصال بالسحابة...', 10);

            if (!this.supabase) {
                await this.loadSupabaseClient();
            }

            this.updateProgress(progressDiv, 'رفع القضايا...', 20);
            await this.uploadCases();

            this.updateProgress(progressDiv, 'رفع المدعى عليهم...', 40);
            await this.uploadDefendants();

            this.updateProgress(progressDiv, 'رفع المحامين...', 60);
            await this.uploadLawyers();

            this.updateProgress(progressDiv, 'رفع الاستقطاعات...', 80);
            await this.uploadDeductions();

            this.updateProgress(progressDiv, 'رفع الإعدادات...', 90);
            await this.uploadSettings();

            this.updateProgress(progressDiv, 'اكتمل الرفع!', 100);

            setTimeout(() => {
                this.closeSyncProgress(progressDiv);
                showNotification('نجح الرفع', 'تم رفع جميع البيانات إلى السحابة ✓', 'success');
            }, 1000);

            this.isSyncing = false;
            return { success: true };

        } catch (error) {
            console.error('خطأ في الرفع:', error);
            this.closeSyncProgress(progressDiv);
            showNotification('خطأ', 'فشل الرفع: ' + error.message, 'error');
            this.isSyncing = false;
            return { success: false };
        }
    }

    // ====== إجبار التحميل من السحابة (استبدال كامل) ======
    async forceDownloadFromCloud() {
        if (this.isSyncing) {
            showNotification('تنبيه', 'المزامنة قيد التشغيل بالفعل', 'warning');
            return { success: false };
        }

        this.isSyncing = true;
        const progressDiv = this.showSyncProgress();

        try {
            this.updateProgress(progressDiv, 'جاري الاتصال بالسحابة...', 10);

            if (!this.supabase) {
                await this.loadSupabaseClient();
            }

            this.updateProgress(progressDiv, 'حذف البيانات المحلية...', 30);

            // حذف جميع البيانات المحلية
            dataManager.casesData = [];
            dataManager.defendantsData = [];
            dataManager.lawyersData = [];
            dataManager.deductionsData = [];
            dataManager.settingsData = {};
            dataManager.filteredCases = [];
            dataManager.filteredDefendants = [];
            dataManager.filteredLawyers = [];
            dataManager.filteredDeductions = [];

            this.updateProgress(progressDiv, 'تحميل البيانات من السحابة...', 70);

            // تحميل البيانات من السحابة
            await this.downloadAllData();

            this.updateProgress(progressDiv, 'اكتمل الاستبدال!', 100);

            setTimeout(() => {
                this.closeSyncProgress(progressDiv);
                showNotification('تم الاستبدال', 'تم استبدال جميع البيانات المحلية بالبيانات السحابية ✓', 'success');
            }, 1000);

            this.refreshUI();

            this.isSyncing = false;
            return { success: true };

        } catch (error) {
            console.error('خطأ في الاستبدال:', error);
            this.closeSyncProgress(progressDiv);
            showNotification('خطأ', 'فشل الاستبدال: ' + error.message, 'error');
            this.isSyncing = false;
            return { success: false };
        }
    }

    // ====== واجهة المستخدم ======
    showSyncProgress() {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay active';
        overlay.innerHTML = `
            <div class="modal" style="max-width: 500px;">
                <div style="text-align: center; padding: 2rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">
                        <i class="fas fa-cloud-upload-alt" style="color: var(--primary-blue);"></i>
                    </div>
                    <h3 style="margin-bottom: 1rem;">جاري المزامنة</h3>
                    <div id="sync-status" style="color: var(--gray-600); margin-bottom: 1.5rem;">
                        جاري التحضير...
                    </div>
                    <div style="background: var(--gray-200); height: 8px; border-radius: 4px; overflow: hidden;">
                        <div id="sync-progress" style="background: var(--gradient-primary); height: 100%; width: 0%; transition: width 0.3s ease;"></div>
                    </div>
                    <div id="sync-percent" style="margin-top: 0.5rem; font-weight: 700; color: var(--primary-blue);">0%</div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        return overlay;
    }

    updateProgress(overlay, message, percent) {
        const statusEl = overlay.querySelector('#sync-status');
        const progressEl = overlay.querySelector('#sync-progress');
        const percentEl = overlay.querySelector('#sync-percent');

        if (statusEl) statusEl.textContent = message;
        if (progressEl) progressEl.style.width = percent + '%';
        if (percentEl) percentEl.textContent = percent + '%';
    }

    closeSyncProgress(overlay) {
        setTimeout(() => {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
        }, 500);
    }

    refreshUI() {
        if (typeof updateDashboardStats === 'function') updateDashboardStats();
        if (typeof renderCasesTable === 'function') renderCasesTable();
        if (typeof renderDefendantsTable === 'function') renderDefendantsTable();
        if (typeof renderLawyersTable === 'function') renderLawyersTable();
        if (typeof renderDeductionsTable === 'function') renderDeductionsTable();
        if (typeof updateLawyerSelector === 'function') updateLawyerSelector();
    }

    // ====== حذف البيانات السحابية ======
    async deleteAllCloudData() {
        if (!confirm('⚠️ تحذير!\n\nسيتم حذف جميع بياناتك من السحابة نهائياً.\nهذا الإجراء لا يمكن التراجع عنه!\n\nهل أنت متأكد من المتابعة؟')) {
            return { success: false };
        }

        try {
            showNotification('الحذف', 'جاري حذف البيانات...', 'info');

            await this.supabase.from('cases').delete().eq('user_id', this.userId);
            await this.supabase.from('defendants').delete().eq('user_id', this.userId);
            await this.supabase.from('lawyers').delete().eq('user_id', this.userId);
            await this.supabase.from('deductions').delete().eq('user_id', this.userId);
            await this.supabase.from('settings').delete().eq('user_id', this.userId);

            showNotification('تم الحذف', 'تم حذف جميع البيانات من السحابة', 'success');
            return { success: true };

        } catch (error) {
            console.error('خطأ في الحذف:', error);
            showNotification('خطأ', 'فشل الحذف: ' + error.message, 'error');
            return { success: false };
        }
    }

    getSyncStatus() {
        return {
            userId: this.userId,
            lastSyncTime: this.lastSyncTime,
            isSyncing: this.isSyncing
        };
    }
}

// إنشاء نسخة عامة
window.supabaseSync = new SupabaseSyncComplete();

// دالة عامة لإعادة تحميل البيانات
async function retryDataDownload() {
    if (window.supabaseSync) {
        const success = await window.supabaseSync.retryDownload();
        if (success && typeof closeModal === 'function') {
            closeModal(document.querySelector('.modal-overlay .btn-secondary'));
        }
    }
}

// دالة لفحص حالة البيانات وإظهار معلومات مفيدة
function checkDataStatus() {
    if (!window.supabaseSync) {
        console.log('❌ نظام المزامنة غير متوفر');
        return;
    }

    const status = window.supabaseSync.getSyncStatus();
    const hasLocalData = window.supabaseSync.checkForLocalData();

    console.log('📊 حالة البيانات:', {
        userId: status.userId,
        lastSyncTime: status.lastSyncTime,
        isSyncing: status.isSyncing,
        hasLocalData: hasLocalData,
        isOnline: navigator.onLine
    });

    if (typeof showNotification === 'function') {
        const message = `
المستخدم: ${status.userId}
البيانات المحلية: ${hasLocalData ? 'موجودة' : 'غير موجودة'}
الاتصال: ${navigator.onLine ? 'متصل' : 'غير متصل'}
آخر مزامنة: ${status.lastSyncTime ? new Date(status.lastSyncTime).toLocaleString('ar-SA') : 'لم تتم'}
        `;

        showNotification('حالة البيانات', message, 'info');
    }
}

// دالة طوارئ لإعادة تعيين البيانات المحلية وتحميلها من السحابة
async function emergencyDataReset() {
    if (!confirm('⚠️ تحذير!\n\nسيتم حذف جميع البيانات المحلية وإعادة تحميلها من السحابة.\n\nهل أنت متأكد؟')) {
        return;
    }

    try {
        console.log('🔄 بدء إعادة تعيين البيانات...');

        // حذف البيانات المحلية
        if (window.dataManager) {
            window.dataManager.casesData = [];
            window.dataManager.defendantsData = [];
            window.dataManager.lawyersData = [];
            window.dataManager.deductionsData = [];
            window.dataManager.settingsData = {};
            window.dataManager.filteredCases = [];
            window.dataManager.filteredDefendants = [];
            window.dataManager.filteredLawyers = [];
            window.dataManager.filteredDeductions = [];
            await window.dataManager.saveData();
        }

        // إعادة تحميل البيانات من السحابة
        if (window.supabaseSync) {
            const success = await window.supabaseSync.retryDownload();
            if (success) {
                console.log('✅ تم إعادة تعيين البيانات بنجاح');
                if (typeof showNotification === 'function') {
                    showNotification('تم بنجاح', 'تم إعادة تعيين البيانات وتحميلها من السحابة', 'success');
                }
            }
        }

    } catch (error) {
        console.error('❌ خطأ في إعادة تعيين البيانات:', error);
        if (typeof showNotification === 'function') {
            showNotification('خطأ', 'فشل في إعادة تعيين البيانات: ' + error.message, 'error');
        }
    }
}

// ====== واجهة المستخدم ======
function showSyncPanel() {
    const status = window.supabaseSync.getSyncStatus();

    const content = `
        <div style="min-width: 550px;">
            <div style="background: linear-gradient(135deg, var(--primary-blue-light), var(--indigo-light)); padding: 2rem; border-radius: 1rem; margin-bottom: 2rem; text-align: center;">
                <div style="font-size: 3.5rem; margin-bottom: 1rem;">
                    <i class="fas fa-cloud" style="color: var(--primary-blue);"></i>
                </div>
                <h2 style="margin-bottom: 0.5rem; color: var(--gray-900);">المزامنة السحابية</h2>
                <p style="color: var(--gray-600); font-size: 0.875rem;">مزامنة بياناتك عبر جميع الأجهزة</p>
            </div>

            <div style="background: var(--gray-50); padding: 1.5rem; border-radius: 0.75rem; margin-bottom: 2rem;">
                <div style="display: grid; gap: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: white; border-radius: 0.5rem;">
                        <span style="color: var(--gray-600);">معرف المستخدم:</span>
                        <code style="background: var(--gray-100); padding: 0.25rem 0.75rem; border-radius: 0.25rem; font-size: 0.75rem;">${status.userId}</code>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: white; border-radius: 0.5rem;">
                        <span style="color: var(--gray-600);">آخر مزامنة:</span>
                        <strong style="color: var(--gray-900);">${status.lastSyncTime ? new Date(status.lastSyncTime).toLocaleString('ar-EG') : 'لم تتم بعد'}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: white; border-radius: 0.5rem;">
                        <span style="color: var(--gray-600);">البيانات المحلية:</span>
                        <div style="text-align: left;">
                            <div style="font-size: 0.75rem; color: var(--gray-600);">
                                ${dataManager.casesData.length} قضية | 
                                ${dataManager.defendantsData.length} مدعى عليه | 
                                ${dataManager.lawyersData.length} محامي | 
                                ${dataManager.deductionsData.length} استقطاع
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div style="display: grid; gap: 1rem; margin-bottom: 2rem;">
                <button class="btn btn-primary" onclick="handleSync('full')" style="font-size: 1rem; padding: 1rem;">
                    <i class="fas fa-sync-alt"></i>
                    <span style="font-weight: 700;">مزامنة كاملة (رفع + تحميل)</span>
                </button>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <button class="btn btn-success" onclick="handleSync('upload')">
                        <i class="fas fa-cloud-upload-alt"></i>
                        رفع البيانات
                    </button>
                    
                    <button class="btn btn-secondary" onclick="handleSync('download')">
                        <i class="fas fa-cloud-download-alt"></i>
                        تحميل البيانات
                    </button>
                </div>

                <button class="btn btn-info" onclick="handleSync('force-download')" style="background: var(--orange); border-color: var(--orange);">
                    <i class="fas fa-download"></i>
                    استبدال البيانات المحلية بالسحابية
                </button>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <button class="btn" onclick="checkDataStatus()" style="background: var(--indigo); border-color: var(--indigo); color: white;">
                        <i class="fas fa-info-circle"></i>
                        فحص حالة البيانات
                    </button>
                    
                    <button class="btn" onclick="emergencyDataReset()" style="background: var(--purple); border-color: var(--purple); color: white;">
                        <i class="fas fa-first-aid"></i>
                        إعادة تعيين طوارئ
                    </button>
                </div>

                <button class="btn btn-danger" onclick="handleSync('delete')">
                    <i class="fas fa-trash-alt"></i>
                    حذف البيانات السحابية
                </button>
            </div>

            <div style="background: var(--indigo-light); padding: 1.25rem; border-radius: 0.75rem; border-right: 4px solid var(--indigo);">
                <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
                    <i class="fas fa-info-circle" style="color: var(--indigo); font-size: 1.25rem;"></i>
                    <div style="flex: 1;">
                        <strong style="display: block; margin-bottom: 0.5rem; color: var(--gray-900);">كيف تعمل المزامنة؟</strong>
                        <ul style="margin: 0; padding-right: 1.25rem; line-height: 1.8; font-size: 0.875rem; color: var(--gray-700);">
                            <li><strong>المزامنة الكاملة:</strong> ترفع بياناتك المحلية ثم تحملها من السحابة (مزامنة ثنائية)</li>
                            <li><strong>الرفع:</strong> نسخ البيانات من جهازك إلى السحابة فقط</li>
                            <li><strong>التحميل:</strong> نسخ البيانات من السحابة إلى جهازك فقط</li>
                            <li><strong>الاستبدال:</strong> حذف البيانات المحلية واستبدالها بالبيانات السحابية (مفيد للأجهزة الجديدة)</li>
                            <li><strong>فحص الحالة:</strong> عرض تفاصيل حالة البيانات والاتصال</li>
                            <li><strong>إعادة التعيين:</strong> حل طوارئ لحذف البيانات المحلية وإعادة التحميل</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;

    createModal('إدارة المزامنة السحابية', content);
}

async function handleSync(action) {
    let result;

    switch (action) {
        case 'full':
            result = await window.supabaseSync.syncAll();
            break;
        case 'upload':
            result = await window.supabaseSync.uploadOnly();
            break;
        case 'download':
            result = await window.supabaseSync.downloadOnly();
            break;
        case 'force-download':
            // تأكيد من المستخدم قبل الاستبدال
            if (confirm('⚠️ تحذير!\n\nسيتم حذف جميع البيانات المحلية واستبدالها بالبيانات الموجودة في السحابة.\n\nهل أنت متأكد من المتابعة؟')) {
                result = await window.supabaseSync.forceDownloadFromCloud();
            }
            break;
        case 'retry':
            result = await window.supabaseSync.retryDownload();
            break;
        case 'delete':
            result = await window.supabaseSync.deleteAllCloudData();
            break;
    }

    if (result && result.success) {
        closeModal(event.target);
    }
}

// إضافة الأزرار إلى الواجهة
document.addEventListener('DOMContentLoaded', function () {
    // زر في الإعدادات
    setTimeout(() => {
        const settingsGrid = document.querySelector('#settings-content .grid-2');
        if (settingsGrid) {
            const syncCard = document.createElement('div');
            syncCard.className = 'card';
            syncCard.style.gridColumn = '1 / -1';
            syncCard.innerHTML = `
                <h3 style="display: flex; align-items: center; gap: 0.75rem;">
                    <i class="fas fa-cloud" style="color: var(--primary-blue);"></i>
                    المزامنة السحابية
                </h3>
                <p style="color: var(--gray-600); margin: 1rem 0 1.5rem; line-height: 1.6;">
                    قم بمزامنة جميع بياناتك (القضايا، المدعى عليهم، المحامين، الاستقطاعات، الإعدادات) 
                    عبر الأجهزة المختلفة باستخدام التخزين السحابي الآمن.
                </p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <button class="btn btn-primary" onclick="showSyncPanel()">
                        <i class="fas fa-cog"></i>
                        فتح لوحة المزامنة
                    </button>
                    <button class="btn btn-success" onclick="window.supabaseSync.syncAll()">
                        <i class="fas fa-sync"></i>
                        مزامنة سريعة
                    </button>
                </div>
            `;
            settingsGrid.appendChild(syncCard);
        }
    }, 500);

    // زر في الهيدر
    const headerRight = document.querySelector('.header-right');
    if (headerRight) {
        const syncBtn = document.createElement('button');
        syncBtn.className = 'btn btn-primary';
        syncBtn.style.cssText = 'padding: 0.75rem 1.25rem; display: flex; align-items: center; gap: 0.5rem;';
        syncBtn.innerHTML = '<i class="fas fa-cloud"></i><span>مزامنة</span>';
        syncBtn.onclick = () => window.supabaseSync.syncAll();
        headerRight.insertBefore(syncBtn, headerRight.firstChild);
    }
});

console.log('✓ تم تحميل نظام المزامنة السحابية الكاملة');