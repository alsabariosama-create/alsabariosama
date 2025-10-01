// supabase-sync.js
// نظام المزامنة الشامل مع Supabase

class SupabaseSync {
    constructor() {
        // إعداد Supabase
        this.supabaseUrl = 'https://dopzopezvkwdoeeliwwd.supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcHpvcGV6dmt3ZG9lZWxpd3dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMzg2MDQsImV4cCI6MjA3NDgxNDYwNH0.VZjhi0-tx5EvFwEXUfjCWyMujwbvGrGisSeOdYm0Rnk';
        
        // تحميل Supabase client
        this.loadSupabaseClient();
        
        // معرف المستخدم الفريد (يتم إنشاؤه أو استرجاعه)
        this.userId = this.getUserId();
        
        // حالة المزامنة
        this.isSyncing = false;
        this.lastSyncTime = localStorage.getItem('lastSyncTime') || null;
        
        // إعدادات المزامنة التلقائية
        this.autoSyncEnabled = localStorage.getItem('autoSyncEnabled') === 'true';
        this.autoSyncInterval = parseInt(localStorage.getItem('autoSyncInterval')) || 300000; // 5 دقائق
        this.autoSyncTimer = null;
        
        if (this.autoSyncEnabled) {
            this.startAutoSync();
        }
    }

    // تحميل Supabase Client من CDN
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
    }

    // الحصول على أو إنشاء معرف المستخدم
    getUserId() {
        let userId = localStorage.getItem('syncUserId');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('syncUserId', userId);
        }
        return userId;
    }

    // دالة المزامنة الرئيسية
    async syncAll() {
        if (this.isSyncing) {
            console.log('المزامنة قيد التشغيل بالفعل');
            return { success: false, message: 'المزامنة قيد التشغيل بالفعل' };
        }

        this.isSyncing = true;
        
        try {
            showNotification('المزامنة', 'جاري مزامنة البيانات مع السحابة...', 'info');
            
            // التأكد من تحميل Supabase
            if (!this.supabase) {
                await this.loadSupabaseClient();
            }

            // 1. رفع البيانات المحلية إلى السحابة
            await this.uploadLocalData();
            
            // 2. تحميل البيانات من السحابة
            await this.downloadCloudData();
            
            // 3. دمج البيانات
            await this.mergeData();
            
            // 4. تحديث وقت آخر مزامنة
            this.lastSyncTime = new Date().toISOString();
            localStorage.setItem('lastSyncTime', this.lastSyncTime);
            
            this.isSyncing = false;
            showNotification('تمت المزامنة', 'تم مزامنة جميع البيانات بنجاح', 'success');
            
            // تحديث العرض
            if (window.dataManager) {
                updateDashboardStats();
                renderCasesTable();
                renderDefendantsTable();
                renderLawyersTable();
                renderDeductionsTable();
            }
            
            return { success: true, message: 'تمت المزامنة بنجاح' };
            
        } catch (error) {
            console.error('خطأ في المزامنة:', error);
            this.isSyncing = false;
            showNotification('خطأ', 'فشلت المزامنة: ' + error.message, 'error');
            return { success: false, message: error.message };
        }
    }

    // رفع البيانات المحلية
    async uploadLocalData() {
        const localData = {
            userId: this.userId,
            cases: dataManager.casesData || [],
            defendants: dataManager.defendantsData || [],
            lawyers: dataManager.lawyersData || [],
            deductions: dataManager.deductionsData || [],
            notifications: dataManager.notificationsData || [],
            settings: dataManager.settingsData || {},
            lastModified: new Date().toISOString()
        };

        // رفع إلى جدول user_data
        const { data, error } = await this.supabase
            .from('user_data')
            .upsert({
                user_id: this.userId,
                data: localData,
                updated_at: new Date().toISOString()
            }, { 
                onConflict: 'user_id',
                returning: 'minimal' 
            });

        if (error) throw error;
        
        console.log('تم رفع البيانات المحلية');
    }

    // تحميل البيانات من السحابة
    async downloadCloudData() {
        const { data, error } = await this.supabase
            .from('user_data')
            .select('*')
            .eq('user_id', this.userId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            throw error;
        }

        this.cloudData = data?.data || null;
        console.log('تم تحميل البيانات من السحابة:', this.cloudData ? 'يوجد بيانات' : 'لا توجد بيانات');
        
        return this.cloudData;
    }

    // دمج البيانات (تحديث وليس استبدال)
    async mergeData() {
        if (!this.cloudData) {
            console.log('لا توجد بيانات سحابية للدمج');
            return;
        }

        // دمج القضايا
        if (this.cloudData.cases) {
            this.mergeCases(this.cloudData.cases);
        }

        // دمج المدعى عليهم
        if (this.cloudData.defendants) {
            this.mergeDefendants(this.cloudData.defendants);
        }

        // دمج المحامين
        if (this.cloudData.lawyers) {
            this.mergeLawyers(this.cloudData.lawyers);
        }

        // دمج الاستقطاعات
        if (this.cloudData.deductions) {
            this.mergeDeductions(this.cloudData.deductions);
        }

        // دمج الإشعارات
        if (this.cloudData.notifications) {
            this.mergeNotifications(this.cloudData.notifications);
        }

        // دمج الإعدادات
        if (this.cloudData.settings) {
            this.mergeSettings(this.cloudData.settings);
        }

        // حفظ البيانات المدمجة
        dataManager.saveData();
        console.log('تم دمج جميع البيانات');
    }

    // دمج القضايا
    mergeCases(cloudCases) {
        const localCases = dataManager.casesData;
        const mergedCases = [...localCases];
        
        cloudCases.forEach(cloudCase => {
            const existingIndex = mergedCases.findIndex(c => c.id === cloudCase.id);
            
            if (existingIndex >= 0) {
                // إذا كانت القضية موجودة، احتفظ بالأحدث
                const localCase = mergedCases[existingIndex];
                const cloudDate = new Date(cloudCase.lastUpdate);
                const localDate = new Date(localCase.lastUpdate);
                
                if (cloudDate > localDate) {
                    mergedCases[existingIndex] = cloudCase;
                    console.log(`تم تحديث القضية: ${cloudCase.caseNumber}`);
                }
            } else {
                // قضية جديدة من السحابة
                mergedCases.push(cloudCase);
                console.log(`تمت إضافة قضية جديدة: ${cloudCase.caseNumber}`);
            }
        });
        
        dataManager.casesData = mergedCases;
        dataManager.filteredCases = [...mergedCases];
    }

    // دمج المدعى عليهم
    mergeDefendants(cloudDefendants) {
        const localDefendants = dataManager.defendantsData;
        const mergedDefendants = [...localDefendants];
        
        cloudDefendants.forEach(cloudDefendant => {
            const existingIndex = mergedDefendants.findIndex(d => d.id === cloudDefendant.id);
            
            if (existingIndex >= 0) {
                const localDefendant = mergedDefendants[existingIndex];
                const cloudDate = new Date(cloudDefendant.createdAt);
                const localDate = new Date(localDefendant.createdAt);
                
                if (cloudDate > localDate) {
                    mergedDefendants[existingIndex] = cloudDefendant;
                }
            } else {
                mergedDefendants.push(cloudDefendant);
            }
        });
        
        dataManager.defendantsData = mergedDefendants;
        dataManager.filteredDefendants = [...mergedDefendants];
    }

    // دمج المحامين
    mergeLawyers(cloudLawyers) {
        const localLawyers = dataManager.lawyersData;
        const mergedLawyers = [...localLawyers];
        
        cloudLawyers.forEach(cloudLawyer => {
            const existingIndex = mergedLawyers.findIndex(l => l.id === cloudLawyer.id);
            
            if (existingIndex >= 0) {
                const localLawyer = mergedLawyers[existingIndex];
                const cloudDate = new Date(cloudLawyer.createdAt);
                const localDate = new Date(localLawyer.createdAt);
                
                if (cloudDate > localDate) {
                    mergedLawyers[existingIndex] = cloudLawyer;
                }
            } else {
                mergedLawyers.push(cloudLawyer);
            }
        });
        
        dataManager.lawyersData = mergedLawyers;
        dataManager.filteredLawyers = [...mergedLawyers];
    }

    // دمج الاستقطاعات
    mergeDeductions(cloudDeductions) {
        const localDeductions = dataManager.deductionsData;
        const mergedDeductions = [...localDeductions];
        
        cloudDeductions.forEach(cloudDeduction => {
            const existingIndex = mergedDeductions.findIndex(d => d.id === cloudDeduction.id);
            
            if (existingIndex >= 0) {
                const localDeduction = mergedDeductions[existingIndex];
                const cloudDate = new Date(cloudDeduction.createdAt);
                const localDate = new Date(localDeduction.createdAt);
                
                if (cloudDate > localDate) {
                    mergedDeductions[existingIndex] = cloudDeduction;
                }
            } else {
                mergedDeductions.push(cloudDeduction);
            }
        });
        
        dataManager.deductionsData = mergedDeductions;
        dataManager.filteredDeductions = [...mergedDeductions];
    }

    // دمج الإشعارات
    mergeNotifications(cloudNotifications) {
        const localNotifications = dataManager.notificationsData;
        const mergedNotifications = [...localNotifications];
        
        cloudNotifications.forEach(cloudNotification => {
            const exists = mergedNotifications.some(n => n.id === cloudNotification.id);
            if (!exists) {
                mergedNotifications.push(cloudNotification);
            }
        });
        
        // الاحتفاظ بآخر 50 إشعار فقط
        dataManager.notificationsData = mergedNotifications
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 50);
    }

    // دمج الإعدادات
    mergeSettings(cloudSettings) {
        dataManager.settingsData = {
            ...dataManager.settingsData,
            ...cloudSettings
        };
    }

    // تنزيل البيانات فقط (استيراد كامل)
    async downloadOnly() {
        try {
            showNotification('التحميل', 'جاري تحميل البيانات من السحابة...', 'info');
            
            await this.downloadCloudData();
            
            if (!this.cloudData) {
                showNotification('تحذير', 'لا توجد بيانات في السحابة', 'warning');
                return { success: false, message: 'لا توجد بيانات' };
            }

            // استبدال البيانات المحلية بالكامل
            if (this.cloudData.cases) dataManager.casesData = this.cloudData.cases;
            if (this.cloudData.defendants) dataManager.defendantsData = this.cloudData.defendants;
            if (this.cloudData.lawyers) dataManager.lawyersData = this.cloudData.lawyers;
            if (this.cloudData.deductions) dataManager.deductionsData = this.cloudData.deductions;
            if (this.cloudData.notifications) dataManager.notificationsData = this.cloudData.notifications;
            if (this.cloudData.settings) dataManager.settingsData = this.cloudData.settings;
            
            // تحديث المصفوفات المفلترة
            dataManager.filteredCases = [...dataManager.casesData];
            dataManager.filteredDefendants = [...dataManager.defendantsData];
            dataManager.filteredLawyers = [...dataManager.lawyersData];
            dataManager.filteredDeductions = [...dataManager.deductionsData];
            
            dataManager.saveData();
            
            // تحديث العرض
            updateDashboardStats();
            renderCasesTable();
            renderDefendantsTable();
            renderLawyersTable();
            renderDeductionsTable();
            
            showNotification('تم التحميل', 'تم تحميل البيانات من السحابة بنجاح', 'success');
            return { success: true, message: 'تم التحميل بنجاح' };
            
        } catch (error) {
            console.error('خطأ في التحميل:', error);
            showNotification('خطأ', 'فشل التحميل: ' + error.message, 'error');
            return { success: false, message: error.message };
        }
    }

    // رفع البيانات فقط (نسخ احتياطي)
    async uploadOnly() {
        try {
            showNotification('الرفع', 'جاري رفع البيانات إلى السحابة...', 'info');
            await this.uploadLocalData();
            showNotification('تم الرفع', 'تم رفع البيانات إلى السحابة بنجاح', 'success');
            return { success: true, message: 'تم الرفع بنجاح' };
        } catch (error) {
            console.error('خطأ في الرفع:', error);
            showNotification('خطأ', 'فشل الرفع: ' + error.message, 'error');
            return { success: false, message: error.message };
        }
    }

    // بدء المزامنة التلقائية
    startAutoSync() {
        if (this.autoSyncTimer) {
            clearInterval(this.autoSyncTimer);
        }
        
        this.autoSyncTimer = setInterval(() => {
            console.log('مزامنة تلقائية...');
            this.syncAll();
        }, this.autoSyncInterval);
        
        console.log(`تم بدء المزامنة التلقائية كل ${this.autoSyncInterval / 1000} ثانية`);
    }

    // إيقاف المزامنة التلقائية
    stopAutoSync() {
        if (this.autoSyncTimer) {
            clearInterval(this.autoSyncTimer);
            this.autoSyncTimer = null;
        }
        console.log('تم إيقاف المزامنة التلقائية');
    }

    // تبديل المزامنة التلقائية
    toggleAutoSync(enabled) {
        this.autoSyncEnabled = enabled;
        localStorage.setItem('autoSyncEnabled', enabled.toString());
        
        if (enabled) {
            this.startAutoSync();
        } else {
            this.stopAutoSync();
        }
    }

    // الحصول على حالة المزامنة
    getSyncStatus() {
        return {
            isSyncing: this.isSyncing,
            lastSyncTime: this.lastSyncTime,
            autoSyncEnabled: this.autoSyncEnabled,
            userId: this.userId
        };
    }

    // حذف البيانات السحابية
    async deleteCloudData() {
        if (!confirm('هل أنت متأكد من حذف جميع البيانات من السحابة؟ هذا الإجراء لا يمكن التراجع عنه!')) {
            return { success: false, message: 'تم الإلغاء' };
        }

        try {
            const { error } = await this.supabase
                .from('user_data')
                .delete()
                .eq('user_id', this.userId);

            if (error) throw error;

            showNotification('تم الحذف', 'تم حذف البيانات من السحابة', 'success');
            return { success: true, message: 'تم الحذف بنجاح' };
        } catch (error) {
            console.error('خطأ في الحذف:', error);
            showNotification('خطأ', 'فشل الحذف: ' + error.message, 'error');
            return { success: false, message: error.message };
        }
    }
}

// إنشاء نسخة عامة من SupabaseSync
window.supabaseSync = new SupabaseSync();

// واجهة المستخدم للمزامنة
function showSyncPanel() {
    const status = window.supabaseSync.getSyncStatus();
    
    const content = `
        <div style="min-width: 500px;">
            <div style="background: var(--gray-50); padding: 1.5rem; border-radius: 0.75rem; margin-bottom: 1.5rem;">
                <h3 style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-cloud"></i>
                    حالة المزامنة
                </h3>
                <div style="display: grid; gap: 0.75rem;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>معرف المستخدم:</span>
                        <strong style="font-family: monospace; font-size: 0.875rem;">${status.userId}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>آخر مزامنة:</span>
                        <strong>${status.lastSyncTime ? new Date(status.lastSyncTime).toLocaleString('ar-EG') : 'لم تتم المزامنة بعد'}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span>المزامنة التلقائية:</span>
                        <label style="display: flex; align-items: center; gap: 0.5rem;">
                            <input type="checkbox" id="auto-sync-toggle" ${status.autoSyncEnabled ? 'checked' : ''} 
                                   onchange="window.supabaseSync.toggleAutoSync(this.checked)">
                            <span>${status.autoSyncEnabled ? 'مفعّلة' : 'معطّلة'}</span>
                        </label>
                    </div>
                </div>
            </div>

            <div style="display: grid; gap: 1rem;">
                <button class="btn btn-primary" onclick="handleSyncAction('sync')" ${status.isSyncing ? 'disabled' : ''}>
                    <i class="fas fa-sync"></i>
                    ${status.isSyncing ? 'جاري المزامنة...' : 'مزامنة البيانات (رفع + تحميل)'}
                </button>
                
                <button class="btn btn-success" onclick="handleSyncAction('upload')">
                    <i class="fas fa-cloud-upload-alt"></i>
                    رفع البيانات فقط (نسخ احتياطي)
                </button>
                
                <button class="btn btn-secondary" onclick="handleSyncAction('download')">
                    <i class="fas fa-cloud-download-alt"></i>
                    تحميل البيانات فقط (استبدال)
                </button>
                
                <button class="btn btn-danger" onclick="handleSyncAction('delete')">
                    <i class="fas fa-trash"></i>
                    حذف البيانات من السحابة
                </button>
            </div>

            <div style="margin-top: 1.5rem; padding: 1rem; background: var(--primary-blue-light); border-radius: 0.5rem; font-size: 0.875rem;">
                <strong>ملاحظة:</strong> 
                <ul style="margin: 0.5rem 0 0 1.5rem; line-height: 1.6;">
                    <li><strong>المزامنة:</strong> تدمج البيانات المحلية والسحابية (يحتفظ بالأحدث)</li>
                    <li><strong>الرفع:</strong> ينسخ البيانات المحلية إلى السحابة فقط</li>
                    <li><strong>التحميل:</strong> يستبدل البيانات المحلية بالبيانات السحابية</li>
                </ul>
            </div>
        </div>
    `;

    createModal('إدارة المزامنة السحابية', content);
}

async function handleSyncAction(action) {
    let result;
    
    switch (action) {
        case 'sync':
            result = await window.supabaseSync.syncAll();
            break;
        case 'upload':
            result = await window.supabaseSync.uploadOnly();
            break;
        case 'download':
            result = await window.supabaseSync.downloadOnly();
            break;
        case 'delete':
            result = await window.supabaseSync.deleteCloudData();
            break;
    }
    
    if (result && result.success) {
        // تحديث لوحة المزامنة
        closeModal(event.target);
        setTimeout(() => showSyncPanel(), 500);
    }
}

// إضافة زر المزامنة إلى الواجهة
document.addEventListener('DOMContentLoaded', function() {
    // إضافة زر في قسم الإعدادات
    const settingsContent = document.getElementById('settings-content');
    if (settingsContent) {
        const syncCard = document.createElement('div');
        syncCard.className = 'card';
        syncCard.style.gridColumn = '1 / -1';
        syncCard.innerHTML = `
            <h3>
                <i class="fas fa-cloud"></i>
                المزامنة السحابية
            </h3>
            <p style="color: var(--gray-600); margin-bottom: 1.5rem;">
                قم بمزامنة بياناتك عبر الأجهزة المختلفة باستخدام التخزين السحابي
            </p>
            <button class="btn btn-primary" onclick="showSyncPanel()">
                <i class="fas fa-cloud-upload-alt"></i>
                فتح لوحة المزامنة
            </button>
        `;
        
        const grid = settingsContent.querySelector('.grid-2');
        if (grid) {
            grid.appendChild(syncCard);
        }
    }

    // إضافة زر سريع في الهيدر
    const headerRight = document.querySelector('.header-right');
    if (headerRight) {
        const syncButton = document.createElement('button');
        syncButton.className = 'btn btn-secondary';
        syncButton.style.padding = '0.75rem 1rem';
        syncButton.innerHTML = '<i class="fas fa-cloud"></i> مزامنة';
        syncButton.onclick = () => window.supabaseSync.syncAll();
        headerRight.insertBefore(syncButton, headerRight.firstChild);
    }
});

console.log('تم تحميل نظام المزامنة السحابية');
