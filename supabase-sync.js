// supabase-sync-complete.js
// نظام المزامنة الكاملة مع Supabase

class SupabaseSyncComplete {
    constructor() {
        this.supabaseUrl = 'https://dopzopezvkwdoeeliwwd.supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcHpvcGV6dmt3ZG9lZWxpd3dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMzg2MDQsImV4cCI6MjA3NDgxNDYwNH0.VZjhi0-tx5EvFwEXUfjCWyMujwbvGrGisSeOdYm0Rnk';
        
        this.userId = this.getUserId();
        this.isSyncing = false;
        this.lastSyncTime = localStorage.getItem('lastSyncTime') || null;
        
        this.loadSupabaseClient();
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
            await this.supabase
                .from('cases')
                .upsert({
                    id: caseItem.id,
                    user_id: this.userId,
                    data: caseItem,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'id'
                });
        }
        
        console.log(`✓ تم رفع ${cases.length} قضية`);
    }

    async uploadDefendants() {
        const defendants = dataManager.defendantsData || [];
        
        for (const defendant of defendants) {
            await this.supabase
                .from('defendants')
                .upsert({
                    id: defendant.id,
                    user_id: this.userId,
                    data: defendant,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'id'
                });
        }
        
        console.log(`✓ تم رفع ${defendants.length} مدعى عليه`);
    }

    async uploadLawyers() {
        const lawyers = dataManager.lawyersData || [];
        
        for (const lawyer of lawyers) {
            await this.supabase
                .from('lawyers')
                .upsert({
                    id: lawyer.id,
                    user_id: this.userId,
                    data: lawyer,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'id'
                });
        }
        
        console.log(`✓ تم رفع ${lawyers.length} محامي`);
    }

    async uploadDeductions() {
        const deductions = dataManager.deductionsData || [];
        
        for (const deduction of deductions) {
            await this.supabase
                .from('deductions')
                .upsert({
                    id: deduction.id,
                    user_id: this.userId,
                    data: deduction,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'id'
                });
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
        // تحميل القضايا
        const { data: cases } = await this.supabase
            .from('cases')
            .select('data')
            .eq('user_id', this.userId);
        
        if (cases && cases.length > 0) {
            dataManager.casesData = cases.map(c => c.data);
            dataManager.filteredCases = [...dataManager.casesData];
            console.log(`✓ تم تحميل ${cases.length} قضية`);
        }

        // تحميل المدعى عليهم
        const { data: defendants } = await this.supabase
            .from('defendants')
            .select('data')
            .eq('user_id', this.userId);
        
        if (defendants && defendants.length > 0) {
            dataManager.defendantsData = defendants.map(d => d.data);
            dataManager.filteredDefendants = [...dataManager.defendantsData];
            console.log(`✓ تم تحميل ${defendants.length} مدعى عليه`);
        }

        // تحميل المحامين
        const { data: lawyers } = await this.supabase
            .from('lawyers')
            .select('data')
            .eq('user_id', this.userId);
        
        if (lawyers && lawyers.length > 0) {
            dataManager.lawyersData = lawyers.map(l => l.data);
            dataManager.filteredLawyers = [...dataManager.lawyersData];
            console.log(`✓ تم تحميل ${lawyers.length} محامي`);
        }

        // تحميل الاستقطاعات
        const { data: deductions } = await this.supabase
            .from('deductions')
            .select('data')
            .eq('user_id', this.userId);
        
        if (deductions && deductions.length > 0) {
            dataManager.deductionsData = deductions.map(d => d.data);
            dataManager.filteredDeductions = [...dataManager.deductionsData];
            console.log(`✓ تم تحميل ${deductions.length} استقطاع`);
        }

        // تحميل الإعدادات
        const { data: settings } = await this.supabase
            .from('settings')
            .select('data')
            .eq('user_id', this.userId)
            .single();
        
        if (settings) {
            dataManager.settingsData = settings.data;
            console.log('✓ تم تحميل الإعدادات');
        }

        // حفظ البيانات محلياً
        dataManager.saveData();
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
        case 'delete':
            result = await window.supabaseSync.deleteAllCloudData();
            break;
    }
    
    if (result && result.success) {
        closeModal(event.target);
    }
}

// إضافة الأزرار إلى الواجهة
document.addEventListener('DOMContentLoaded', function() {
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
