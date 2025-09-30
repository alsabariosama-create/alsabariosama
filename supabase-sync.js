// supabase-sync.js - النسخة المحدثة مع واجهة تحكم
(function() {
    'use strict';

    // Supabase Configuration
    const SUPABASE_URL = 'https://dopzopezvkwdoeeliwwd.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcHpvcGV6dmt3ZG9lZWxpd3dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMzg2MDQsImV4cCI6MjA3NDgxNDYwNH0.VZjhi0-tx5EvFwEXUfjCWyMujwbvGrGisSeOdYm0Rnk';

    let supabase;
    let syncEnabled = true;
    let userId = null;
    let syncStats = {
        lastSync: null,
        totalSyncs: 0,
        errors: 0,
        casesCount: 0,
        defendantsCount: 0,
        lawyersCount: 0,
        deductionsCount: 0
    };

    // Load Supabase Client
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = initializeSupabase;
    document.head.appendChild(script);

    // Add UI after DOM loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addSupabaseUI);
    } else {
        addSupabaseUI();
    }

    function addSupabaseUI() {
        // Add CSS
        const style = document.createElement('style');
        style.textContent = `
            .supabase-control {
                position: fixed;
                top: 45px;
                left: 20px;
                z-index: 1002;
            }

            .supabase-btn {
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: 12px;
                cursor: pointer;
                font-weight: 600;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 8px;
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                transition: all 0.3s ease;
            }

            .supabase-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
            }

            .supabase-btn.disconnected {
                background: linear-gradient(135deg, #ef4444, #dc2626);
            }

            .supabase-indicator {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #fff;
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            .supabase-panel {
                position: fixed;
                top: 100px;
                left: 20px;
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
                width: 400px;
                max-height: 80vh;
                overflow-y: auto;
                z-index: 1003;
                display: none;
                border: 1px solid #e5e7eb;
            }

            .supabase-panel.active {
                display: block;
                animation: slideIn 0.3s ease;
            }

            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .supabase-panel-header {
                padding: 20px;
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
                border-radius: 16px 16px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .supabase-panel-header h3 {
                margin: 0;
                font-size: 18px;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .supabase-close-btn {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                width: 32px;
                height: 32px;
                border-radius: 8px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            }

            .supabase-close-btn:hover {
                background: rgba(255, 255, 255, 0.3);
            }

            .supabase-panel-body {
                padding: 20px;
            }

            .supabase-section {
                margin-bottom: 24px;
                padding-bottom: 24px;
                border-bottom: 1px solid #e5e7eb;
            }

            .supabase-section:last-child {
                border-bottom: none;
                margin-bottom: 0;
                padding-bottom: 0;
            }

            .supabase-section-title {
                font-size: 14px;
                font-weight: 700;
                color: #374151;
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .supabase-stat {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px;
                background: #f9fafb;
                border-radius: 8px;
                margin-bottom: 8px;
            }

            .supabase-stat-label {
                font-size: 13px;
                color: #6b7280;
            }

            .supabase-stat-value {
                font-size: 15px;
                font-weight: 700;
                color: #10b981;
            }

            .supabase-connection-status {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px;
                background: #f0fdf4;
                border: 1px solid #bbf7d0;
                border-radius: 8px;
                margin-bottom: 16px;
            }

            .supabase-connection-status.disconnected {
                background: #fef2f2;
                border-color: #fecaca;
            }

            .supabase-status-dot {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: #10b981;
            }

            .supabase-status-dot.disconnected {
                background: #ef4444;
            }

            .supabase-status-text {
                font-size: 14px;
                font-weight: 600;
                color: #059669;
            }

            .supabase-status-text.disconnected {
                color: #dc2626;
            }

            .supabase-action-btn {
                width: 100%;
                padding: 12px;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                margin-bottom: 8px;
            }

            .supabase-action-btn.primary {
                background: linear-gradient(135deg, #3b82f6, #2563eb);
                color: white;
            }

            .supabase-action-btn.primary:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            }

            .supabase-action-btn.success {
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
            }

            .supabase-action-btn.success:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            }

            .supabase-action-btn.danger {
                background: linear-gradient(135deg, #ef4444, #dc2626);
                color: white;
            }

            .supabase-action-btn.danger:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
            }

            .supabase-action-btn.secondary {
                background: #f3f4f6;
                color: #374151;
            }

            .supabase-action-btn.secondary:hover {
                background: #e5e7eb;
            }

            .supabase-config-field {
                margin-bottom: 16px;
            }

            .supabase-config-field label {
                display: block;
                font-size: 13px;
                font-weight: 600;
                color: #374151;
                margin-bottom: 8px;
            }

            .supabase-config-field input {
                width: 100%;
                padding: 10px 12px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-size: 13px;
                transition: all 0.3s ease;
            }

            .supabase-config-field input:focus {
                outline: none;
                border-color: #10b981;
                box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
            }

            .supabase-toggle {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px;
                background: #f9fafb;
                border-radius: 8px;
                margin-bottom: 8px;
            }

            .supabase-toggle-label {
                font-size: 14px;
                font-weight: 600;
                color: #374151;
            }

            .supabase-switch {
                position: relative;
                width: 48px;
                height: 24px;
                background: #d1d5db;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .supabase-switch.active {
                background: #10b981;
            }

            .supabase-switch-handle {
                position: absolute;
                top: 2px;
                right: 2px;
                width: 20px;
                height: 20px;
                background: white;
                border-radius: 50%;
                transition: all 0.3s ease;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }

            .supabase-switch.active .supabase-switch-handle {
                right: 26px;
            }

            .supabase-sync-log {
                max-height: 150px;
                overflow-y: auto;
                background: #f9fafb;
                border-radius: 8px;
                padding: 12px;
                font-size: 12px;
                font-family: 'Courier New', monospace;
            }

            .supabase-log-entry {
                padding: 4px 0;
                color: #6b7280;
            }

            .supabase-log-entry.success {
                color: #10b981;
            }

            .supabase-log-entry.error {
                color: #ef4444;
            }
        `;
        document.head.appendChild(style);

        // Add HTML
        const html = `
            <div class="supabase-control">
                <button class="supabase-btn" id="supabase-toggle-btn">
                    <span class="supabase-indicator"></span>
                    <span>قاعدة البيانات السحابية</span>
                    <i class="fas fa-cloud"></i>
                </button>
            </div>

            <div class="supabase-panel" id="supabase-panel">
                <div class="supabase-panel-header">
                    <h3>
                        <i class="fas fa-database"></i>
                        لوحة تحكم Supabase
                    </h3>
                    <button class="supabase-close-btn" onclick="document.getElementById('supabase-panel').classList.remove('active')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="supabase-panel-body">
                    <!-- حالة الاتصال -->
                    <div class="supabase-section">
                        <div class="supabase-connection-status" id="supabase-connection-status">
                            <span class="supabase-status-dot" id="supabase-status-dot"></span>
                            <span class="supabase-status-text" id="supabase-status-text">متصل بالسحابة</span>
                        </div>
                    </div>

                    <!-- إحصائيات المزامنة -->
                    <div class="supabase-section">
                        <div class="supabase-section-title">
                            <i class="fas fa-chart-line"></i>
                            إحصائيات المزامنة
                        </div>
                        <div class="supabase-stat">
                            <span class="supabase-stat-label">آخر مزامنة</span>
                            <span class="supabase-stat-value" id="stat-last-sync">-</span>
                        </div>
                        <div class="supabase-stat">
                            <span class="supabase-stat-label">إجمالي المزامنات</span>
                            <span class="supabase-stat-value" id="stat-total-syncs">0</span>
                        </div>
                        <div class="supabase-stat">
                            <span class="supabase-stat-label">الأخطاء</span>
                            <span class="supabase-stat-value" style="color: #ef4444;" id="stat-errors">0</span>
                        </div>
                    </div>

                    <!-- البيانات المحفوظة -->
                    <div class="supabase-section">
                        <div class="supabase-section-title">
                            <i class="fas fa-database"></i>
                            البيانات المحفوظة
                        </div>
                        <div class="supabase-stat">
                            <span class="supabase-stat-label">الدعاوى</span>
                            <span class="supabase-stat-value" id="stat-cases">0</span>
                        </div>
                        <div class="supabase-stat">
                            <span class="supabase-stat-label">المدعى عليهم</span>
                            <span class="supabase-stat-value" id="stat-defendants">0</span>
                        </div>
                        <div class="supabase-stat">
                            <span class="supabase-stat-label">المحامون</span>
                            <span class="supabase-stat-value" id="stat-lawyers">0</span>
                        </div>
                        <div class="supabase-stat">
                            <span class="supabase-stat-label">الاستقطاعات</span>
                            <span class="supabase-stat-value" id="stat-deductions">0</span>
                        </div>
                    </div>

                    <!-- التحكم في المزامنة -->
                    <div class="supabase-section">
                        <div class="supabase-section-title">
                            <i class="fas fa-cog"></i>
                            التحكم في المزامنة
                        </div>
                        <div class="supabase-toggle">
                            <span class="supabase-toggle-label">المزامنة التلقائية</span>
                            <div class="supabase-switch active" id="sync-toggle" onclick="toggleSync()">
                                <div class="supabase-switch-handle"></div>
                            </div>
                        </div>
                    </div>

                    <!-- الإجراءات -->
                    <div class="supabase-section">
                        <div class="supabase-section-title">
                            <i class="fas fa-bolt"></i>
                            الإجراءات السريعة
                        </div>
                        <button class="supabase-action-btn success" onclick="forceSyncNow()">
                            <i class="fas fa-sync"></i>
                            مزامنة الآن
                        </button>
                        <button class="supabase-action-btn primary" onclick="uploadAllData()">
                            <i class="fas fa-cloud-upload-alt"></i>
                            رفع جميع البيانات
                        </button>
                        <button class="supabase-action-btn primary" onclick="downloadAllData()">
                            <i class="fas fa-cloud-download-alt"></i>
                            تحميل من السحابة
                        </button>
                        <button class="supabase-action-btn danger" onclick="clearCloudData()">
                            <i class="fas fa-trash"></i>
                            مسح البيانات السحابية
                        </button>
                    </div>

                    <!-- معرف المستخدم -->
                    <div class="supabase-section">
                        <div class="supabase-section-title">
                            <i class="fas fa-user"></i>
                            معلومات الحساب
                        </div>
                        <div class="supabase-config-field">
                            <label>معرف المستخدم</label>
                            <input type="text" id="user-id-display" readonly style="font-size: 11px; font-family: monospace;">
                        </div>
                    </div>

                    <!-- سجل النشاط -->
                    <div class="supabase-section">
                        <div class="supabase-section-title">
                            <i class="fas fa-list"></i>
                            سجل النشاط
                        </div>
                        <div class="supabase-sync-log" id="sync-log">
                            <div class="supabase-log-entry">في انتظار النشاط...</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const container = document.createElement('div');
        container.innerHTML = html;
        document.body.appendChild(container);

        // Event listeners
        document.getElementById('supabase-toggle-btn').addEventListener('click', () => {
            document.getElementById('supabase-panel').classList.toggle('active');
            updateUI();
        });
    }

    function initializeSupabase() {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        addLog('تم الاتصال بـ Supabase بنجاح', 'success');
        
        initializeUser();
        enhanceDataManager();
        syncFromSupabase();
        
        setInterval(syncFromSupabase, 30000);
        setInterval(updateUI, 5000);
    }

    async function initializeUser() {
        userId = localStorage.getItem('userId');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('userId', userId);
        }
        updateUI();
        addLog('معرف المستخدم: ' + userId);
    }

    function enhanceDataManager() {
        if (!window.dataManager) {
            setTimeout(enhanceDataManager, 1000);
            return;
        }

        const originalAddCase = window.dataManager.addCase.bind(window.dataManager);
        const originalUpdateCase = window.dataManager.updateCase.bind(window.dataManager);
        const originalDeleteCase = window.dataManager.deleteCase.bind(window.dataManager);
        const originalAddDefendant = window.dataManager.addDefendant.bind(window.dataManager);
        const originalUpdateDefendant = window.dataManager.updateDefendant.bind(window.dataManager);
        const originalDeleteDefendant = window.dataManager.deleteDefendant.bind(window.dataManager);
        const originalAddLawyer = window.dataManager.addLawyer.bind(window.dataManager);
        const originalUpdateLawyer = window.dataManager.updateLawyer.bind(window.dataManager);
        const originalDeleteLawyer = window.dataManager.deleteLawyer.bind(window.dataManager);
        const originalAddDeduction = window.dataManager.addDeduction.bind(window.dataManager);
        const originalUpdateDeduction = window.dataManager.updateDeduction.bind(window.dataManager);
        const originalDeleteDeduction = window.dataManager.deleteDeduction.bind(window.dataManager);
        const originalUpdateSettings = window.dataManager.updateSettings.bind(window.dataManager);

        window.dataManager.addCase = async function(caseData) {
            const newCase = originalAddCase(caseData);
            if (syncEnabled) await syncCaseToSupabase(newCase, 'insert');
            return newCase;
        };

        window.dataManager.updateCase = async function(id, updates) {
            const updatedCase = originalUpdateCase(id, updates);
            if (syncEnabled && updatedCase) await syncCaseToSupabase(updatedCase, 'update');
            return updatedCase;
        };

        window.dataManager.deleteCase = async function(id) {
            const result = originalDeleteCase(id);
            if (syncEnabled && result) await syncCaseToSupabase({ id }, 'delete');
            return result;
        };

        window.dataManager.addDefendant = async function(defendantData) {
            const newDefendant = originalAddDefendant(defendantData);
            if (syncEnabled) await syncDefendantToSupabase(newDefendant, 'insert');
            return newDefendant;
        };

        window.dataManager.updateDefendant = async function(id, updates) {
            const updated = originalUpdateDefendant(id, updates);
            if (syncEnabled && updated) await syncDefendantToSupabase(updated, 'update');
            return updated;
        };

        window.dataManager.deleteDefendant = async function(id) {
            const result = originalDeleteDefendant(id);
            if (syncEnabled && result) await syncDefendantToSupabase({ id }, 'delete');
            return result;
        };

        window.dataManager.addLawyer = async function(lawyerData) {
            const newLawyer = originalAddLawyer(lawyerData);
            if (syncEnabled) await syncLawyerToSupabase(newLawyer, 'insert');
            return newLawyer;
        };

        window.dataManager.updateLawyer = async function(id, updates) {
            const updated = originalUpdateLawyer(id, updates);
            if (syncEnabled && updated) await syncLawyerToSupabase(updated, 'update');
            return updated;
        };

        window.dataManager.deleteLawyer = async function(id) {
            const result = originalDeleteLawyer(id);
            if (syncEnabled && result) await syncLawyerToSupabase({ id }, 'delete');
            return result;
        };

        window.dataManager.addDeduction = async function(deductionData) {
            const newDeduction = originalAddDeduction(deductionData);
            if (syncEnabled) await syncDeductionToSupabase(newDeduction, 'insert');
            return newDeduction;
        };

        window.dataManager.updateDeduction = async function(id, updates) {
            const updated = originalUpdateDeduction(id, updates);
            if (syncEnabled && updated) await syncDeductionToSupabase(updated, 'update');
            return updated;
        };

        window.dataManager.deleteDeduction = async function(id) {
            const result = originalDeleteDeduction(id);
            if (syncEnabled && result) await syncDeductionToSupabase({ id }, 'delete');
            return result;
        };

        window.dataManager.updateSettings = async function(updates) {
            const updated = originalUpdateSettings(updates);
            if (syncEnabled) await syncSettingsToSupabase(updated);
            return updated;
        };

        addLog('تم ربط DataManager بنجاح', 'success');
    }

    async function syncCaseToSupabase(caseData, operation) {
        try {
            const data = { ...caseData, user_id: userId, synced_at: new Date().toISOString() };
            
            if (operation === 'insert') {
                const { error } = await supabase.from('cases').insert(data);
                if (error) throw error;
                addLog('تم حفظ دعوى جديدة', 'success');
            } else if (operation === 'update') {
                const { error } = await supabase.from('cases').update(data).eq('id', caseData.id).eq('user_id', userId);
                if (error) throw error;
                addLog('تم تحديث دعوى', 'success');
            } else if (operation === 'delete') {
                const { error } = await supabase.from('cases').delete().eq('id', caseData.id).eq('user_id', userId);
                if (error) throw error;
                addLog('تم حذف دعوى', 'success');
            }
            syncStats.totalSyncs++;
            updateUI();
        } catch (error) {
            syncStats.errors++;
            addLog('خطأ في مزامنة الدعوى: ' + error.message, 'error');
        }
    }

    async function syncDefendantToSupabase(defendantData, operation) {
        try {
            const data = { ...defendantData, user_id: userId, synced_at: new Date().toISOString() };
            
            if (operation === 'insert') {
                const { error } = await supabase.from('defendants').insert(data);
                if (error) throw error;
                addLog('تم حفظ مدعى عليه جديد', 'success');
            } else if (operation === 'update') {
                const { error } = await supabase.from('defendants').update(data).eq('id', defendantData.id).eq('user_id', userId);
                if (error) throw error;
                addLog('تم تحديث مدعى عليه', 'success');
            } else if (operation === 'delete') {
                const { error } = await supabase.from('defendants').delete().eq('id', defendantData.id).eq('user_id', userId);
                if (error) throw error;
                addLog('تم حذف مدعى عليه', 'success');
            }
            syncStats.totalSyncs++;
            updateUI();
        } catch (error) {
            syncStats.errors++;
            addLog('خطأ في مزامنة المدعى عليه: ' + error.message, 'error');
        }
    }

    async function syncLawyerToSupabase(lawyerData, operation) {
        try {
            const data = { ...lawyerData, user_id: userId, synced_at: new Date().toISOString() };
            
            if (operation === 'insert') {
                const { error } = await supabase.from('lawyers').insert(data);
                if (error) throw error;
                addLog('تم حفظ محامي جديد', 'success');
            } else if (operation === 'update') {
                const { error } = await supabase.from('lawyers').update(data).eq('id', lawyerData.id).eq('user_id', userId);
                if (error) throw error;
                addLog('تم تحديث محامي', 'success');
            } else if (operation === 'delete') {
                const { error } = await supabase.from('lawyers').delete().eq('id', lawyerData.id).eq('user_id', userId);
                if (error) throw error;
                addLog('تم حذف محامي', 'success');
            }
            syncStats.totalSyncs++;
            updateUI();
        } catch (error) {
            syncStats.errors++;
            addLog('خطأ في مزامنة المحامي: ' + error.message, 'error');
        }
    }

    async function syncDeductionToSupabase(deductionData, operation) {
        try {
            const data = { ...deductionData, user_id: userId, synced_at: new Date().toISOString() };
            
            if (operation === 'insert') {
                const { error } = await supabase.from('deductions').insert(data);
                if (error) throw error;
                addLog('تم حفظ استقطاع جديد', 'success');
            } else if (operation === 'update') {
                const { error } = await supabase.from('deductions').update(data).eq('id', deductionData.id).eq('user_id', userId);
                if (error) throw error;
                addLog('تم تحديث استقطاع', 'success');
            } else if (operation === 'delete') {
                const { error } = await supabase.from('deductions').delete().eq('id', deductionData.id).eq('user_id', userId);
                if (error) throw error;
                addLog('تم حذف استقطاع', 'success');
            }
            syncStats.totalSyncs++;
            updateUI();
        } catch (error) {
            syncStats.errors++;
            addLog('خطأ في مزامنة الاستقطاع: ' + error.message, 'error');
        }
    }

    async function syncSettingsToSupabase(settingsData) {
        try {
            const data = { 
                user_id: userId, 
                settings_json: JSON.stringify(settingsData),
                updated_at: new Date().toISOString()
            };
            
            const { error } = await supabase.from('settings').upsert(data, { onConflict: 'user_id' });
            if (error) throw error;
            addLog('تم حفظ الإعدادات', 'success');
            syncStats.totalSyncs++;
            updateUI();
        } catch (error) {
            syncStats.errors++;
            addLog('خطأ في مزامنة الإعدادات: ' + error.message, 'error');
        }
    }

    async function syncFromSupabase() {
        if (!supabase || !userId || !syncEnabled) return;
        
        try {
            const lastSync = localStorage.getItem('lastSupabaseSync') || new Date(0).toISOString();
            
            const { data: cases } = await supabase.from('cases').select('*').eq('user_id', userId).gte('synced_at', lastSync);
            const { data: defendants } = await supabase.from('defendants').select('*').eq('user_id', userId).gte('synced_at', lastSync);
            const { data: lawyers } = await supabase.from('lawyers').select('*').eq('user_id', userId).gte('synced_at', lastSync);
            const { data: deductions } = await supabase.from('deductions').select('*').eq('user_id', userId).gte('synced_at', lastSync);
            const { data: settings } = await supabase.from('settings').select('*').eq('user_id', userId).single();
            
            if (cases && cases.length > 0) {
                syncEnabled = false;
                cases.forEach(c => {
                    const existing = window.dataManager.casesData.find(local => local.id === c.id);
                    if (existing) {
                        Object.assign(existing, c);
                    } else {
                        window.dataManager.casesData.push(c);
                    }
                });
                window.dataManager.filteredCases = [...window.dataManager.casesData];
                if (typeof renderCasesTable === 'function') renderCasesTable();
                syncEnabled = true;
                addLog(`تم استرجاع ${cases.length} دعوى`, 'success');
            }
            
            if (defendants && defendants.length > 0) {
                syncEnabled = false;
                defendants.forEach(d => {
                    const existing = window.dataManager.defendantsData.find(local => local.id === d.id);
                    if (existing) {
                        Object.assign(existing, d);
                    } else {
                        window.dataManager.defendantsData.push(d);
                    }
                });
                window.dataManager.filteredDefendants = [...window.dataManager.defendantsData];
                if (typeof renderDefendantsTable === 'function') renderDefendantsTable();
                syncEnabled = true;
            }
            
            if (lawyers && lawyers.length > 0) {
                syncEnabled = false;
                lawyers.forEach(l => {
                    const existing = window.dataManager.lawyersData.find(local => local.id === l.id);
                    if (existing) {
                        Object.assign(existing, l);
                    } else {
                        window.dataManager.lawyersData.push(l);
                    }
                });
                window.dataManager.filteredLawyers = [...window.dataManager.lawyersData];
                if (typeof renderLawyersTable === 'function') renderLawyersTable();
                syncEnabled = true;
            }
            
            if (deductions && deductions.length > 0) {
                syncEnabled = false;
                deductions.forEach(d => {
                    const existing = window.dataManager.deductionsData.find(local => local.id === d.id);
                    if (existing) {
                        Object.assign(existing, d);
                    } else {
                        window.dataManager.deductionsData.push(d);
                    }
                });
                window.dataManager.filteredDeductions = [...window.dataManager.deductionsData];
                if (typeof renderDeductionsTable === 'function') renderDeductionsTable();
                syncEnabled = true;
            }
            
            if (settings && settings.settings_json) {
                window.dataManager.settingsData = JSON.parse(settings.settings_json);
            }
            
            localStorage.setItem('lastSupabaseSync', new Date().toISOString());
            window.dataManager.saveData();
            
            syncStats.lastSync = new Date();
            syncStats.totalSyncs++;
            updateUI();
            updateCloudStats();
        } catch (error) {
            syncStats.errors++;
            addLog('خطأ في المزامنة: ' + error.message, 'error');
        }
    }

    async function updateCloudStats() {
        try {
            const { count: casesCount } = await supabase.from('cases').select('*', { count: 'exact', head: true }).eq('user_id', userId);
            const { count: defendantsCount } = await supabase.from('defendants').select('*', { count: 'exact', head: true }).eq('user_id', userId);
            const { count: lawyersCount } = await supabase.from('lawyers').select('*', { count: 'exact', head: true }).eq('user_id', userId);
            const { count: deductionsCount } = await supabase.from('deductions').select('*', { count: 'exact', head: true }).eq('user_id', userId);
            
            syncStats.casesCount = casesCount || 0;
            syncStats.defendantsCount = defendantsCount || 0;
            syncStats.lawyersCount = lawyersCount || 0;
            syncStats.deductionsCount = deductionsCount || 0;
            
            updateUI();
        } catch (error) {
            console.error('Error updating cloud stats:', error);
        }
    }

    function updateUI() {
        const statusEl = document.getElementById('supabase-connection-status');
        const statusDotEl = document.getElementById('supabase-status-dot');
        const statusTextEl = document.getElementById('supabase-status-text');
        const btnEl = document.getElementById('supabase-toggle-btn');
        
        if (supabase && syncEnabled) {
            statusEl.classList.remove('disconnected');
            statusDotEl.classList.remove('disconnected');
            statusTextEl.classList.remove('disconnected');
            statusTextEl.textContent = 'متصل بالسحابة';
            btnEl.classList.remove('disconnected');
        } else {
            statusEl.classList.add('disconnected');
            statusDotEl.classList.add('disconnected');
            statusTextEl.classList.add('disconnected');
            statusTextEl.textContent = 'غير متصل';
            btnEl.classList.add('disconnected');
        }
        
        document.getElementById('stat-last-sync').textContent = syncStats.lastSync ? 
            new Date(syncStats.lastSync).toLocaleTimeString('ar-SA') : '-';
        document.getElementById('stat-total-syncs').textContent = syncStats.totalSyncs;
        document.getElementById('stat-errors').textContent = syncStats.errors;
        document.getElementById('stat-cases').textContent = syncStats.casesCount;
        document.getElementById('stat-defendants').textContent = syncStats.defendantsCount;
        document.getElementById('stat-lawyers').textContent = syncStats.lawyersCount;
        document.getElementById('stat-deductions').textContent = syncStats.deductionsCount;
        document.getElementById('user-id-display').value = userId || '';
        
        const toggleEl = document.getElementById('sync-toggle');
        if (syncEnabled) {
            toggleEl.classList.add('active');
        } else {
            toggleEl.classList.remove('active');
        }
    }

    function addLog(message, type = 'info') {
        const logEl = document.getElementById('sync-log');
        if (!logEl) return;
        
        const entry = document.createElement('div');
        entry.className = `supabase-log-entry ${type}`;
        entry.textContent = `[${new Date().toLocaleTimeString('ar-SA')}] ${message}`;
        
        logEl.insertBefore(entry, logEl.firstChild);
        
        // Keep only last 50 entries
        while (logEl.children.length > 50) {
            logEl.removeChild(logEl.lastChild);
        }
    }

    // Global functions
    window.toggleSync = function() {
        syncEnabled = !syncEnabled;
        updateUI();
        addLog(syncEnabled ? 'تم تفعيل المزامنة التلقائية' : 'تم إيقاف المزامنة التلقائية');
    };

    window.forceSyncNow = async function() {
        addLog('جاري المزامنة...');
        await syncFromSupabase();
        addLog('تمت المزامنة بنجاح', 'success');
    };

    window.uploadAllData = async function() {
        if (!confirm('هل تريد رفع جميع البيانات المحلية إلى السحابة؟')) return;
        
        addLog('جاري رفع جميع البيانات...');
        try {
            for (const caseItem of window.dataManager.casesData) {
                await syncCaseToSupabase(caseItem, 'insert');
            }
            for (const defendant of window.dataManager.defendantsData) {
                await syncDefendantToSupabase(defendant, 'insert');
            }
            for (const lawyer of window.dataManager.lawyersData) {
                await syncLawyerToSupabase(lawyer, 'insert');
            }
            for (const deduction of window.dataManager.deductionsData) {
                await syncDeductionToSupabase(deduction, 'insert');
            }
            await syncSettingsToSupabase(window.dataManager.settingsData);
            
            addLog('تم رفع جميع البيانات بنجاح', 'success');
            await updateCloudStats();
        } catch (error) {
            addLog('خطأ في رفع البيانات: ' + error.message, 'error');
        }
    };

    window.downloadAllData = async function() {
        if (!confirm('هل تريد تحميل جميع البيانات من السحابة؟ سيتم استبدال البيانات المحلية.')) return;
        
        addLog('جاري تحميل جميع البيانات...');
        localStorage.removeItem('lastSupabaseSync');
        await syncFromSupabase();
        addLog('تم تحميل جميع البيانات بنجاح', 'success');
    };

    window.clearCloudData = async function() {
        if (!confirm('تحذير: سيتم حذف جميع بياناتك من السحابة بشكل نهائي!\n\nهل أنت متأكد؟')) return;
        if (!confirm('هذا الإجراء لا يمكن التراجع عنه. هل أنت متأكد تماماً؟')) return;
        
        addLog('جاري حذف البيانات من السحابة...');
        try {
            await supabase.from('cases').delete().eq('user_id', userId);
            await supabase.from('defendants').delete().eq('user_id', userId);
            await supabase.from('lawyers').delete().eq('user_id', userId);
            await supabase.from('deductions').delete().eq('user_id', userId);
            await supabase.from('settings').delete().eq('user_id', userId);
            
            addLog('تم حذف جميع البيانات من السحابة', 'success');
            await updateCloudStats();
        } catch (error) {
            addLog('خطأ في حذف البيانات: ' + error.message, 'error');
        }
    };

    window.supabaseSync = {
        enable: () => { syncEnabled = true; updateUI(); },
        disable: () => { syncEnabled = false; updateUI(); },
        forceSync: syncFromSupabase,
        status: () => ({ enabled: syncEnabled, userId, connected: !!supabase, stats: syncStats })
    };

})();
