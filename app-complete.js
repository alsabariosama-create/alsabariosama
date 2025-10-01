// ===================================================================
// ملف شامل لتفعيل جميع وظائف نظام إدارة الدعاوى القضائية
// الإصدار: 1.1.0
// ===================================================================

// ===================================================================
// 1. إصلاح أزرار النافذة وتحسينها
// ===================================================================

// إصلاح أزرار التحكم في النافذة
function fixWindowControls() {
    // دالة تصغير النافذة
    window.minimizeWindow = async function() {
        if (window.electronAPI) {
            try {
                const result = await window.electronAPI.minimizeWindow();
                if (result.success) {
                    console.log('تم تصغير النافذة بنجاح');
                } else {
                    console.error('فشل في تصغير النافذة:', result.error);
                }
            } catch (error) {
                console.error('خطأ في تصغير النافذة:', error);
            }
        } else {
            // للمتصفح العادي
            showNotification('تنبيه', 'هذه الميزة متاحة في تطبيق سطح المكتب فقط', 'info');
        }
    };

    // دالة تكبير/استعادة النافذة
    window.toggleMaximize = async function() {
        if (window.electronAPI) {
            try {
                const result = await window.electronAPI.toggleMaximizeWindow();
                if (result.success) {
                    const icon = document.getElementById('maximize-icon');
                    if (icon) {
                        icon.className = result.state === 'maximized' ? 
                            'fas fa-window-restore' : 'fas fa-window-maximize';
                    }
                    console.log('تم تغيير حالة النافذة:', result.state);
                } else {
                    console.error('فشل في تغيير حالة النافذة:', result.error);
                }
            } catch (error) {
                console.error('خطأ في تغيير حالة النافذة:', error);
            }
        } else {
            // للمتصفح العادي - تبديل ملء الشاشة
            if (document.fullscreenElement) {
                document.exitFullscreen();
                document.getElementById('maximize-icon').className = 'fas fa-window-maximize';
            } else {
                document.documentElement.requestFullscreen();
                document.getElementById('maximize-icon').className = 'fas fa-window-restore';
            }
        }
    };

    // دالة إغلاق النافذة
    window.closeWindow = async function() {
        if (window.electronAPI) {
            try {
                const result = await window.electronAPI.closeWindow();
                if (result.success) {
                    console.log('تم إغلاق النافذة');
                } else if (result.reason === 'User cancelled') {
                    console.log('ألغى المستخدم إغلاق النافذة');
                } else {
                    console.error('فشل في إغلاق النافذة:', result.error);
                }
            } catch (error) {
                console.error('خطأ في إغلاق النافذة:', error);
            }
        } else {
            // للمتصفح العادي
            if (confirm('هل تريد إغلاق التطبيق؟')) {
                window.close();
            }
        }
    };
}

// ===================================================================
// 2. نظام إدارة البيانات المحسن
// ===================================================================

class EnhancedDataManager extends DataManager {
    constructor() {
        super();
        this.setupEventListeners();
        this.initializeBackupSystem();
    }

    // تحسين حفظ البيانات
    async saveData() {
        try {
            if (window.electronAPI) {
                const allData = {
                    cases: this.casesData,
                    defendants: this.defendantsData,
                    lawyers: this.lawyersData,
                    deductions: this.deductionsData,
                    notifications: this.notificationsData,
                    settings: this.settingsData
                };
                
                const result = await window.electronAPI.saveAppData(allData);
                if (result.success) {
                    this.lastSaveTime = new Date();
                    console.log('تم حفظ البيانات بنجاح');
                    return true;
                } else {
                    console.error('خطأ في حفظ البيانات:', result.error);
                    return false;
                }
            } else {
                // استخدام localStorage كبديل
                super.saveData();
                return true;
            }
        } catch (error) {
            console.error('خطأ في حفظ البيانات:', error);
            return false;
        }
    }

    // تحسين تحميل البيانات
    async loadData() {
        try {
            if (window.electronAPI) {
                const result = await window.electronAPI.loadAppData();
                if (result.success && result.data) {
                    this.casesData = result.data.cases || [];
                    this.defendantsData = result.data.defendants || [];
                    this.lawyersData = result.data.lawyers || [];
                    this.deductionsData = result.data.deductions || [];
                    this.notificationsData = result.data.notifications || [];
                    this.settingsData = { ...this.getDefaultSettings(), ...result.data.settings };
                    
                    this.filteredCases = [...this.casesData];
                    this.filteredDefendants = [...this.defendantsData];
                    this.filteredLawyers = [...this.lawyersData];
                    this.filteredDeductions = [...this.deductionsData];
                    
                    console.log('تم تحميل البيانات بنجاح');
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('خطأ في تحميل البيانات:', error);
            return false;
        }
    }

    // إنشاء نسخة احتياطية تلقائية
    initializeBackupSystem() {
        if (this.settingsData.autoBackup) {
            this.scheduleAutoBackup();
        }
    }

    scheduleAutoBackup() {
        if (this.autoBackupInterval) {
            clearInterval(this.autoBackupInterval);
        }
        
        const interval = (this.settingsData.backupInterval || 24) * 60 * 60 * 1000; // بالساعات
        this.autoBackupInterval = setInterval(() => {
            this.createAutoBackup();
        }, interval);
    }

    async createAutoBackup() {
        try {
            const allData = {
                cases: this.casesData,
                defendants: this.defendantsData,
                lawyers: this.lawyersData,
                deductions: this.deductionsData,
                notifications: this.notificationsData,
                settings: this.settingsData
            };

            if (window.electronAPI) {
                const result = await window.electronAPI.createBackup(allData);
                if (result.success) {
                    console.log('تم إنشاء نسخة احتياطية تلقائية:', result.filename);
                    this.addNotification({
                        title: 'نسخة احتياطية',
                        message: `تم إنشاء نسخة احتياطية تلقائية: ${result.filename}`,
                        type: 'info'
                    });
                }
            }
        } catch (error) {
            console.error('خطأ في إنشاء النسخة الاحتياطية التلقائية:', error);
        }
    }

    setupEventListeners() {
        document.addEventListener('autoBackupRequested', () => {
            this.createAutoBackup();
        });
    }
}

// ===================================================================
// 3. وظائف تحرير الدعاوى المتقدمة
// ===================================================================

// تحرير الدعوى الحالية
function editCurrentCase() {
    if (!dataManager.currentCase) {
        showNotification('خطأ', 'لم يتم اختيار دعوى للتحرير', 'error');
        return;
    }

    const caseData = dataManager.currentCase;
    
    const content = `
        <div class="case-form-sections">
            <div class="case-section">
                <div class="section-title">
                    <i class="fas fa-info-circle"></i>
                    المعلومات الأساسية
                </div>
                
                <div class="form-row">
                    <div class="form-field required">
                        <label><i class="fas fa-file"></i>رقم الدعوى</label>
                        <input type="text" id="edit-case-number" value="${caseData.caseNumber}" required>
                    </div>
                    <div class="form-field required">
                        <label><i class="fas fa-calendar"></i>تاريخ رفع الدعوى</label>
                        <input type="date" id="edit-case-file-date" value="${caseData.fileDate}" required>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-field required">
                        <label><i class="fas fa-flag"></i>أولوية الدعوى</label>
                        <select id="edit-case-priority" required>
                            <option value="عادية" ${caseData.priority === 'عادية' ? 'selected' : ''}>عادية</option>
                            <option value="مهمة" ${caseData.priority === 'مهمة' ? 'selected' : ''}>مهمة</option>
                            <option value="عاجلة" ${caseData.priority === 'عاجلة' ? 'selected' : ''}>عاجلة</option>
                            <option value="طارئة" ${caseData.priority === 'طارئة' ? 'selected' : ''}>طارئة</option>
                        </select>
                    </div>
                    <div class="form-field required">
                        <label><i class="fas fa-info-circle"></i>الحالة</label>
                        <select id="edit-case-status" required>
                            <option value="مسودة" ${caseData.status === 'مسودة' ? 'selected' : ''}>مسودة</option>
                            <option value="مرفوعة" ${caseData.status === 'مرفوعة' ? 'selected' : ''}>مرفوعة</option>
                            <option value="تحت المراجعة" ${caseData.status === 'تحت المراجعة' ? 'selected' : ''}>تحت المراجعة</option>
                            <option value="في المحكمة" ${caseData.status === 'في المحكمة' ? 'selected' : ''}>في المحكمة</option>
                            <option value="صدر الحكم" ${caseData.status === 'صدر الحكم' ? 'selected' : ''}>صدر الحكم</option>
                            <option value="تبليغ بالحكم" ${caseData.status === 'تبليغ بالحكم' ? 'selected' : ''}>تبليغ بالحكم</option>
                            <option value="تنفيذ" ${caseData.status === 'تنفيذ' ? 'selected' : ''}>تنفيذ</option>
                            <option value="مغلقة" ${caseData.status === 'مغلقة' ? 'selected' : ''}>مغلقة</option>
                        </select>
                    </div>
                </div>

                <div class="form-field required form-field-full">
                    <label><i class="fas fa-align-right"></i>موضوع الدعوى</label>
                    <textarea id="edit-case-subject" rows="3" required>${caseData.subject}</textarea>
                </div>

                <div class="form-field required form-field-full">
                    <label><i class="fas fa-dollar-sign"></i>مبلغ الدعوى (د.ع)</label>
                    <input type="number" id="edit-case-amount" value="${caseData.amount}" required>
                </div>
            </div>

            <div class="case-section">
                <div class="section-title">
                    <i class="fas fa-users"></i>
                    أطراف الدعوى
                </div>
                
                <div class="form-row">
                    <div class="form-field required">
                        <label><i class="fas fa-user"></i>اسم المدعي</label>
                        <input type="text" id="edit-case-plaintiff-name" value="${caseData.plaintiffName}" required>
                    </div>
                    <div class="form-field">
                        <label><i class="fas fa-phone"></i>رقم الهاتف</label>
                        <input type="tel" id="edit-case-plaintiff-phone" value="${caseData.plaintiffPhone || ''}">
                    </div>
                </div>

                <div class="form-field form-field-full">
                    <label><i class="fas fa-map-marker-alt"></i>عنوان المدعي</label>
                    <textarea id="edit-case-plaintiff-address" rows="2">${caseData.plaintiffAddress || ''}</textarea>
                </div>

                <div class="form-field required form-field-full">
                    <label><i class="fas fa-user-tie"></i>اسم المدعى عليه</label>
                    <input type="text" id="edit-case-defendant-name" value="${caseData.defendantName}" required>
                </div>

                <div class="form-field form-field-full">
                    <label><i class="fas fa-map-marker-alt"></i>عنوان المدعى عليه</label>
                    <textarea id="edit-case-defendant-address" rows="2">${caseData.defendantAddress || ''}</textarea>
                </div>
            </div>

            <div class="case-section">
                <div class="section-title">
                    <i class="fas fa-balance-scale"></i>
                    التفاصيل القانونية
                </div>
                
                <div class="form-row">
                    <div class="form-field">
                        <label><i class="fas fa-user-tie"></i>المحامي المسؤول</label>
                        <input type="text" id="edit-case-lawyer-name" value="${caseData.lawyerName || ''}">
                    </div>
                    <div class="form-field required">
                        <label><i class="fas fa-building"></i>اسم المحكمة</label>
                        <input type="text" id="edit-case-court-name" value="${caseData.courtName}" required>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-field">
                        <label><i class="fas fa-hashtag"></i>اسم الدائرة</label>
                        <input type="text" id="edit-case-court-section" value="${caseData.courtSection || ''}">
                    </div>
                    <div class="form-field">
                        <label><i class="fas fa-tasks"></i>المرحلة الحالية</label>
                        <select id="edit-case-stage">
                            <option value="إعداد الدعوى" ${caseData.stage === 'إعداد الدعوى' ? 'selected' : ''}>إعداد الدعوى</option>
                            <option value="تقديم الدعوى" ${caseData.stage === 'تقديم الدعوى' ? 'selected' : ''}>تقديم الدعوى</option>
                            <option value="التبليغ" ${caseData.stage === 'التبليغ' ? 'selected' : ''}>التبليغ</option>
                            <option value="المرافعة" ${caseData.stage === 'المرافعة' ? 'selected' : ''}>المرافعة</option>
                            <option value="تحت الدراسة" ${caseData.stage === 'تحت الدراسة' ? 'selected' : ''}>تحت الدراسة</option>
                            <option value="صدور الحكم" ${caseData.stage === 'صدور الحكم' ? 'selected' : ''}>صدور الحكم</option>
                            <option value="الاستئناف" ${caseData.stage === 'الاستئناف' ? 'selected' : ''}>الاستئناف</option>
                            <option value="التنفيذ" ${caseData.stage === 'التنفيذ' ? 'selected' : ''}>التنفيذ</option>
                        </select>
                    </div>
                </div>

                <div class="form-field">
                    <label><i class="fas fa-calendar"></i>تاريخ الجلسة القادمة</label>
                    <input type="date" id="edit-case-hearing" value="${caseData.nextHearing || ''}">
                </div>
            </div>

            <div class="case-section">
                <div class="section-title">
                    <i class="fas fa-comment"></i>
                    الملاحظات والتحديثات
                </div>
                
                <div class="form-field form-field-full">
                    <label><i class="fas fa-comment"></i>ملاحظات إضافية</label>
                    <textarea id="edit-case-notes" rows="4">${caseData.notes || ''}</textarea>
                </div>

                <div class="form-field form-field-full">
                    <label><i class="fas fa-history"></i>إضافة تحديث جديد</label>
                    <textarea id="new-case-update" rows="3" placeholder="اكتب التحديث الجديد هنا..."></textarea>
                </div>
            </div>
        </div>
    `;

    const actions = `
        <button class="btn btn-secondary" onclick="closeModal(this)">إلغاء</button>
        <button class="btn btn-primary" onclick="saveCaseEdits(${caseData.id})">
            <i class="fas fa-save"></i>
            حفظ التعديلات
        </button>
    `;

    createModal(`تحرير الدعوى - ${caseData.plaintiffName}`, content, actions);
}

// حفظ تعديلات الدعوى
function saveCaseEdits(caseId) {
    const updates = {
        caseNumber: document.getElementById('edit-case-number').value.trim(),
        fileDate: document.getElementById('edit-case-file-date').value,
        priority: document.getElementById('edit-case-priority').value,
        status: document.getElementById('edit-case-status').value,
        subject: document.getElementById('edit-case-subject').value.trim(),
        amount: parseInt(document.getElementById('edit-case-amount').value) || 0,
        plaintiffName: document.getElementById('edit-case-plaintiff-name').value.trim(),
        plaintiffPhone: document.getElementById('edit-case-plaintiff-phone').value.trim(),
        plaintiffAddress: document.getElementById('edit-case-plaintiff-address').value.trim(),
        defendantName: document.getElementById('edit-case-defendant-name').value.trim(),
        defendantAddress: document.getElementById('edit-case-defendant-address').value.trim(),
        lawyerName: document.getElementById('edit-case-lawyer-name').value.trim(),
        courtName: document.getElementById('edit-case-court-name').value.trim(),
        courtSection: document.getElementById('edit-case-court-section').value.trim(),
        stage: document.getElementById('edit-case-stage').value,
        nextHearing: document.getElementById('edit-case-hearing').value,
        notes: document.getElementById('edit-case-notes').value.trim()
    };

    const newUpdate = document.getElementById('new-case-update').value.trim();

    // التحقق من صحة البيانات
    if (!updates.caseNumber || !updates.fileDate || !updates.subject || !updates.plaintiffName || !updates.defendantName || !updates.amount) {
        showNotification('خطأ', 'يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
    }

    // إضافة التحديث الجديد إلى الجدول الزمني
    if (newUpdate) {
        if (!dataManager.currentCase.timeline) {
            dataManager.currentCase.timeline = [];
        }
        
        dataManager.currentCase.timeline.push({
            date: new Date().toISOString().split('T')[0],
            title: 'تحديث جديد',
            desc: newUpdate,
            type: 'blue'
        });
    }

    // تحديث الدعوى
    const updatedCase = dataManager.updateCase(caseId, updates);
    if (updatedCase) {
        dataManager.currentCase = updatedCase;
        
        // إعادة رسم جميع العناصر
        renderCasesTable();
        renderCaseProgress();
        renderCaseInfo();
        renderCaseTimeline();
        
        closeModal(event.target);
        showNotification('تم الحفظ', 'تم تحديث بيانات الدعوى بنجاح', 'success');
        
        // إضافة إشعار للتحديث
        if (newUpdate) {
            dataManager.addNotification({
                title: 'تحديث دعوى',
                message: `تم إضافة تحديث جديد للدعوى ${updates.caseNumber}`,
                type: 'info'
            });
        }
    } else {
        showNotification('خطأ', 'فشل في تحديث الدعوى', 'error');
    }
}

// ===================================================================
// 4. نظام التقارير المتقدم
// ===================================================================

// إنشاء تقرير شامل
function generateComprehensiveReport() {
    const stats = dataManager.getStatistics();
    
    const content = `
        <div style="max-height: 70vh; overflow-y: auto;">
            <div class="report-header" style="text-align: center; margin-bottom: 2rem; padding: 2rem; background: var(--gradient-primary); color: white; border-radius: 1rem;">
                <h2 style="margin: 0; font-size: 2rem;">التقرير الشامل</h2>
                <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">مجموعة السيد أسامة القانونية</p>
                <p style="margin: 0.25rem 0 0 0; opacity: 0.8; font-size: 0.875rem;">تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}</p>
            </div>

            <div class="report-section" style="margin-bottom: 2rem;">
                <h3 style="color: var(--primary-blue); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-chart-pie"></i>
                    الإحصائيات العامة
                </h3>
                <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <div style="background: var(--primary-blue-light); padding: 1.5rem; border-radius: 0.75rem; text-align: center;">
                        <div style="font-size: 2rem; font-weight: 800; color: var(--primary-blue); margin-bottom: 0.5rem;">${stats.totalCases}</div>
                        <div style="color: var(--gray-600);">إجمالي الدعاوى</div>
                    </div>
                    <div style="background: var(--warning-yellow-light); padding: 1.5rem; border-radius: 0.75rem; text-align: center;">
                        <div style="font-size: 2rem; font-weight: 800; color: var(--warning-yellow); margin-bottom: 0.5rem;">${stats.pendingCases}</div>
                        <div style="color: var(--gray-600);">تحت المراجعة</div>
                    </div>
                    <div style="background: var(--success-green-light); padding: 1.5rem; border-radius: 0.75rem; text-align: center;">
                        <div style="font-size: 2rem; font-weight: 800; color: var(--success-green); margin-bottom: 0.5rem;">${stats.completedCases}</div>
                        <div style="color: var(--gray-600);">مكتملة</div>
                    </div>
                    <div style="background: var(--purple-light); padding: 1.5rem; border-radius: 0.75rem; text-align: center;">
                        <div style="font-size: 2rem; font-weight: 800; color: var(--purple); margin-bottom: 0.5rem;">${stats.successRate}%</div>
                        <div style="color: var(--gray-600);">معدل النجاح</div>
                    </div>
                </div>
            </div>

            <div class="report-section" style="margin-bottom: 2rem;">
                <h3 style="color: var(--success-green); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-dollar-sign"></i>
                    التقرير المالي
                </h3>
                <div style="background: var(--gray-50); padding: 1.5rem; border-radius: 0.75rem;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                        <div>
                            <div style="font-weight: 600; color: var(--gray-700); margin-bottom: 0.5rem;">إجمالي مبالغ الدعاوى</div>
                            <div style="font-size: 1.5rem; font-weight: 800; color: var(--primary-blue);">${dataManager.formatNumber(stats.totalAmount)} د.ع</div>
                        </div>
                        <div>
                            <div style="font-weight: 600; color: var(--gray-700); margin-bottom: 0.5rem;">إجمالي الاستقطاعات</div>
                            <div style="font-size: 1.5rem; font-weight: 800; color: var(--success-green);">${dataManager.formatNumber(stats.totalDeductions)} د.ع</div>
                        </div>
                        <div>
                            <div style="font-weight: 600; color: var(--gray-700); margin-bottom: 0.5rem;">المبلغ المتبقي</div>
                            <div style="font-size: 1.5rem; font-weight: 800; color: var(--error-red);">${dataManager.formatNumber(stats.totalAmount - stats.totalDeductions)} د.ع</div>
                        </div>
                        <div>
                            <div style="font-weight: 600; color: var(--gray-700); margin-bottom: 0.5rem;">نسبة التحصيل</div>
                            <div style="font-size: 1.5rem; font-weight: 800; color: var(--purple);">${stats.totalAmount > 0 ? Math.round((stats.totalDeductions / stats.totalAmount) * 100) : 0}%</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="report-section" style="margin-bottom: 2rem;">
                <h3 style="color: var(--indigo); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-users"></i>
                    إحصائيات المدعى عليهم والمحامين
                </h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                    <div style="background: var(--indigo-light); padding: 1.5rem; border-radius: 0.75rem;">
                        <h4 style="margin: 0 0 1rem 0; color: var(--indigo);">المدعى عليهم</h4>
                        <div style="font-size: 2rem; font-weight: 800; color: var(--indigo); margin-bottom: 0.5rem;">${dataManager.defendantsData.length}</div>
                        <div style="color: var(--gray-600);">إجمالي المدعى عليهم المسجلين</div>
                        <div style="margin-top: 1rem; font-size: 0.875rem; color: var(--gray-600);">
                            متوسط الدعاوى لكل مدعى عليه: ${dataManager.defendantsData.length > 0 ? Math.round(stats.totalCases / dataManager.defendantsData.length * 10) / 10 : 0}
                        </div>
                    </div>
                    <div style="background: var(--success-green-light); padding: 1.5rem; border-radius: 0.75rem;">
                        <h4 style="margin: 0 0 1rem 0; color: var(--success-green);">المحامون</h4>
                        <div style="font-size: 2rem; font-weight: 800; color: var(--success-green); margin-bottom: 0.5rem;">${dataManager.lawyersData.length}</div>
                        <div style="color: var(--gray-600);">إجمالي المحامين المسجلين</div>
                        <div style="margin-top: 1rem; font-size: 0.875rem; color: var(--gray-600);">
                            متوسط الدعاوى لكل محامي: ${dataManager.lawyersData.length > 0 ? Math.round(stats.totalCases / dataManager.lawyersData.length * 10) / 10 : 0}
                        </div>
                    </div>
                </div>
            </div>

            <div class="report-section" style="margin-bottom: 2rem;">
                <h3 style="color: var(--warning-yellow); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-chart-line"></i>
                    تحليل الأداء
                </h3>
                <div style="background: var(--warning-yellow-light); padding: 1.5rem; border-radius: 0.75rem;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        <div>
                            <div style="font-weight: 600; color: var(--gray-700); margin-bottom: 0.5rem;">قضايا هذا الشهر</div>
                            <div style="font-size: 1.5rem; font-weight: 800; color: var(--warning-yellow);">${stats.monthlyCases}</div>
                        </div>
                        <div>
                            <div style="font-weight: 600; color: var(--gray-700); margin-bottom: 0.5rem;">متوسط مدة القضية</div>
                            <div style="font-size: 1.5rem; font-weight: 800; color: var(--warning-yellow);">${stats.avgDuration} شهر</div>
                        </div>
                        <div>
                            <div style="font-weight: 600; color: var(--gray-700); margin-bottom: 0.5rem;">متوسط الاستقطاع</div>
                            <div style="font-size: 1.5rem; font-weight: 800; color: var(--warning-yellow);">${dataManager.deductionsData.length > 0 ? dataManager.formatNumber(Math.round(stats.totalDeductions / dataManager.deductionsData.length)) : 0} د.ع</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="report-section">
                <h3 style="color: var(--error-red); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-exclamation-triangle"></i>
                    التنبيهات والتوصيات
                </h3>
                <div style="background: var(--error-red-light); padding: 1.5rem; border-radius: 0.75rem;">
                    ${generateRecommendations(stats)}
                </div>
            </div>
        </div>
    `;

    const actions = `
        <button class="btn btn-secondary" onclick="closeModal(this)">إغلاق</button>
        <button class="btn btn-primary" onclick="exportComprehensiveReport()">
            <i class="fas fa-download"></i>
            تصدير التقرير
        </button>
        <button class="btn btn-success" onclick="printComprehensiveReport()">
            <i class="fas fa-print"></i>
            طباعة التقرير
        </button>
    `;

    createModal('التقرير الشامل', content, actions);
}

// إنشاء التوصيات
function generateRecommendations(stats) {
    const recommendations = [];
    
    if (stats.pendingCases > stats.completedCases) {
        recommendations.push('• يوجد عدد كبير من الدعاوى المعلقة. يُنصح بمراجعة وتسريع إجراءاتها.');
    }
    
    if (stats.totalAmount > 0 && (stats.totalDeductions / stats.totalAmount) < 0.5) {
        recommendations.push('• نسبة التحصيل أقل من 50%. يُنصح بتكثيف جهود التحصيل.');
    }
    
    if (stats.avgDuration > 12) {
        recommendations.push('• متوسط مدة القضايا أكثر من سنة. يُنصح بمراجعة الإجراءات لتسريع العملية.');
    }
    
    if (stats.monthlyCases === 0) {
        recommendations.push('• لم يتم إضافة قضايا جديدة هذا الشهر. قد يحتاج المكتب لتعزيز جهود التسويق.');
    }
    
    if (dataManager.deductionsData.length === 0) {
        recommendations.push('• لم يتم تسجيل أي استقطاعات. تأكد من تحديث سجلات التحصيل.');
    }

    if (recommendations.length === 0) {
        recommendations.push('• الأداء العام جيد. استمر في الحفاظ على هذا المستوى.');
        recommendations.push('• يُنصح بإجراء مراجعة دورية للتأكد من دقة البيانات.');
    }

    return recommendations.map(rec => `<div style="margin-bottom: 0.5rem; color: var(--gray-700);">${rec}</div>`).join('');
}

// تصدير التقرير الشامل
async function exportComprehensiveReport() {
    const stats = dataManager.getStatistics();
    
    const reportData = {
        reportType: 'comprehensive',
        generatedDate: new Date().toISOString(),
        officeName: dataManager.settingsData.officeName,
        statistics: stats,
        cases: dataManager.casesData,
        defendants: dataManager.defendantsData,
        lawyers: dataManager.lawyersData,
        deductions: dataManager.deductionsData,
        summary: {
            totalCases: stats.totalCases,
            pendingCases: stats.pendingCases,
            completedCases: stats.completedCases,
            totalAmount: stats.totalAmount,
            totalDeductions: stats.totalDeductions,
            remainingAmount: stats.totalAmount - stats.totalDeductions,
            collectionRate: stats.totalAmount > 0 ? Math.round((stats.totalDeductions / stats.totalAmount) * 100) : 0,
            successRate: stats.successRate,
            avgDuration: stats.avgDuration,
            monthlyCases: stats.monthlyCases
        }
    };

    if (window.electronAPI) {
        try {
            const result = await window.electronAPI.exportData(reportData);
            if (result.success) {
                closeModal(document.querySelector('.modal-close'));
                showNotification('تم التصدير', `تم تصدير التقرير الشامل إلى: ${result.path}`, 'success');
            } else {
                showNotification('خطأ', 'فشل في تصدير التقرير', 'error');
            }
        } catch (error) {
            console.error('خطأ في تصدير التقرير:', error);
            showNotification('خطأ', 'حدث خطأ أثناء تصدير التقرير', 'error');
        }
    } else {
        // للمتصفح العادي
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `comprehensive-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        closeModal(document.querySelector('.modal-close'));
        showNotification('تم التصدير', 'تم تصدير التقرير الشامل بنجاح', 'success');
    }
}

// طباعة التقرير الشامل
function printComprehensiveReport() {
    if (window.electronAPI) {
        window.electronAPI.printView();
    } else {
        window.print();
    }
}

// ===================================================================
// 5. نظام البحث المتقدم
// ===================================================================

// إظهار نافذة البحث المتقدم
function showAdvancedSearch() {
    const content = `
        <div class="advanced-search-container">
            <div class="search-tabs" style="display: flex; margin-bottom: 2rem; background: var(--gray-100); border-radius: 0.75rem; padding: 0.5rem;">
                <button class="search-tab active" onclick="switchSearchTab('cases', this)" style="flex: 1; padding: 0.75rem; border: none; background: var(--primary-blue); color: white; border-radius: 0.5rem; margin-left: 0.25rem;">الدعاوى</button>
                <button class="search-tab" onclick="switchSearchTab('defendants', this)" style="flex: 1; padding: 0.75rem; border: none; background: transparent; color: var(--gray-600); border-radius: 0.5rem; margin-left: 0.25rem;">المدعى عليهم</button>
                <button class="search-tab" onclick="switchSearchTab('lawyers', this)" style="flex: 1; padding: 0.75rem; border: none; background: transparent; color: var(--gray-600); border-radius: 0.5rem; margin-left: 0.25rem;">المحامين</button>
                <button class="search-tab" onclick="switchSearchTab('deductions', this)" style="flex: 1; padding: 0.75rem; border: none; background: transparent; color: var(--gray-600); border-radius: 0.5rem;">الاستقطاعات</button>
            </div>

            <div id="search-cases-tab" class="search-tab-content">
                <div class="form-row">
                    <div class="form-field">
                        <label>رقم الدعوى</label>
                        <input type="text" id="search-case-number" placeholder="مثال: D-2024-001">
                    </div>
                    <div class="form-field">
                        <label>اسم المدعي</label>
                        <input type="text" id="search-plaintiff-name" placeholder="اسم المدعي">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-field">
                        <label>اسم المدعى عليه</label>
                        <input type="text" id="search-defendant-name" placeholder="اسم المدعى عليه">
                    </div>
                    <div class="form-field">
                        <label>الحالة</label>
                        <select id="search-case-status">
                            <option value="">جميع الحالات</option>
                            <option value="تحت المراجعة">تحت المراجعة</option>
                            <option value="صدر الحكم">صدر الحكم</option>
                            <option value="تبليغ بالحكم">تبليغ بالحكم</option>
                            <option value="تنفيذ">تنفيذ</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-field">
                        <label>من تاريخ</label>
                        <input type="date" id="search-date-from">
                    </div>
                    <div class="form-field">
                        <label>إلى تاريخ</label>
                        <input type="date" id="search-date-to">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-field">
                        <label>مبلغ الدعوى من</label>
                        <input type="number" id="search-amount-from" placeholder="الحد الأدنى">
                    </div>
                    <div class="form-field">
                        <label>مبلغ الدعوى إلى</label>
                        <input type="number" id="search-amount-to" placeholder="الحد الأقصى">
                    </div>
                </div>
            </div>

            <div id="search-defendants-tab" class="search-tab-content hidden">
                <div class="form-row">
                    <div class="form-field">
                        <label>اسم المدعى عليه</label>
                        <input type="text" id="search-defendant-full-name" placeholder="الاسم الكامل">
                    </div>
                    <div class="form-field">
                        <label>رقم الهاتف</label>
                        <input type="tel" id="search-defendant-phone" placeholder="رقم الهاتف">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-field">
                        <label>البريد الإلكتروني</label>
                        <input type="email" id="search-defendant-email" placeholder="البريد الإلكتروني">
                    </div>
                    <div class="form-field">
                        <label>جهة العمل</label>
                        <input type="text" id="search-defendant-workplace" placeholder="جهة العمل">
                    </div>
                </div>
            </div>

            <div id="search-lawyers-tab" class="search-tab-content hidden">
                <div class="form-row">
                    <div class="form-field">
                        <label>اسم المحامي</label>
                        <input type="text" id="search-lawyer-name" placeholder="اسم المحامي">
                    </div>
                    <div class="form-field">
                        <label>رقم الترخيص</label>
                        <input type="text" id="search-lawyer-license" placeholder="رقم الترخيص">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-field">
                        <label>التخصص</label>
                        <select id="search-lawyer-specialization">
                            <option value="">جميع التخصصات</option>
                            <option value="القانون المدني">القانون المدني</option>
                            <option value="القانون التجاري">القانون التجاري</option>
                            <option value="قانون العمل">قانون العمل</option>
                            <option value="القانون الجنائي">القانون الجنائي</option>
                        </select>
                    </div>
                    <div class="form-field">
                        <label>سنوات الخبرة (الحد الأدنى)</label>
                        <input type="number" id="search-lawyer-experience" placeholder="سنوات الخبرة" min="0">
                    </div>
                </div>
            </div>

            <div id="search-deductions-tab" class="search-tab-content hidden">
                <div class="form-row">
                    <div class="form-field">
                        <label>رقم الدعوى</label>
                        <input type="text" id="search-deduction-case" placeholder="رقم الدعوى">
                    </div>
                    <div class="form-field">
                        <label>المصدر</label>
                        <select id="search-deduction-source">
                            <option value="">جميع المصادر</option>
                            <option value="محكمة البداءة">محكمة البداءة</option>
                            <option value="دائرة التنفيذ">دائرة التنفيذ</option>
                            <option value="محكمة الاستئناف">محكمة الاستئناف</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-field">
                        <label>المبلغ من</label>
                        <input type="number" id="search-deduction-amount-from" placeholder="الحد الأدنى">
                    </div>
                    <div class="form-field">
                        <label>المبلغ إلى</label>
                        <input type="number" id="search-deduction-amount-to" placeholder="الحد الأقصى">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-field">
                        <label>من تاريخ</label>
                        <input type="date" id="search-deduction-date-from">
                    </div>
                    <div class="form-field">
                        <label>إلى تاريخ</label>
                        <input type="date" id="search-deduction-date-to">
                    </div>
                </div>
            </div>

            <div id="search-results" class="search-results" style="margin-top: 2rem; max-height: 300px; overflow-y: auto; display: none;">
                <h4 style="margin-bottom: 1rem;">نتائج البحث:</h4>
                <div id="search-results-content"></div>
            </div>
        </div>
    `;

    const actions = `
        <button class="btn btn-secondary" onclick="closeModal(this)">إغلاق</button>
        <button class="btn btn-secondary" onclick="clearSearchForm()">
            <i class="fas fa-eraser"></i>
            مسح الحقول
        </button>
        <button class="btn btn-primary" onclick="performAdvancedSearch()">
            <i class="fas fa-search"></i>
            بحث
        </button>
    `;

    createModal('البحث المتقدم', content, actions);
}

// تبديل تبويب البحث
function switchSearchTab(tabName, button) {
    // إخفاء جميع التبويبات
    document.querySelectorAll('.search-tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // إزالة الكلاس النشط من جميع الأزرار
    document.querySelectorAll('.search-tab').forEach(btn => {
        btn.style.background = 'transparent';
        btn.style.color = 'var(--gray-600)';
    });
    
    // إظهار التبويب المحدد
    document.getElementById(`search-${tabName}-tab`).classList.remove('hidden');
    
    // تفعيل الزر المحدد
    button.style.background = 'var(--primary-blue)';
    button.style.color = 'white';
}

// مسح نموذج البحث
function clearSearchForm() {
    document.querySelectorAll('.search-tab-content input, .search-tab-content select').forEach(input => {
        input.value = '';
    });
    
    document.getElementById('search-results').style.display = 'none';
}

// تنفيذ البحث المتقدم
function performAdvancedSearch() {
    const activeTab = document.querySelector('.search-tab-content:not(.hidden)');
    const tabId = activeTab.id;
    
    let results = [];
    
    if (tabId === 'search-cases-tab') {
        results = searchCasesAdvanced();
    } else if (tabId === 'search-defendants-tab') {
        results = searchDefendantsAdvanced();
    } else if (tabId === 'search-lawyers-tab') {
        results = searchLawyersAdvanced();
    } else if (tabId === 'search-deductions-tab') {
        results = searchDeductionsAdvanced();
    }
    
    displaySearchResults(results, tabId);
}

// البحث المتقدم في الدعاوى
function searchCasesAdvanced() {
    const criteria = {
        caseNumber: document.getElementById('search-case-number').value.trim(),
        plaintiffName: document.getElementById('search-plaintiff-name').value.trim(),
        defendantName: document.getElementById('search-defendant-name').value.trim(),
        status: document.getElementById('search-case-status').value,
        dateFrom: document.getElementById('search-date-from').value,
        dateTo: document.getElementById('search-date-to').value,
        amountFrom: parseInt(document.getElementById('search-amount-from').value) || 0,
        amountTo: parseInt(document.getElementById('search-amount-to').value) || Infinity
    };
    
    return dataManager.casesData.filter(caseItem => {
        return (!criteria.caseNumber || caseItem.caseNumber.toLowerCase().includes(criteria.caseNumber.toLowerCase())) &&
               (!criteria.plaintiffName || caseItem.plaintiffName.toLowerCase().includes(criteria.plaintiffName.toLowerCase())) &&
               (!criteria.defendantName || caseItem.defendantName.toLowerCase().includes(criteria.defendantName.toLowerCase())) &&
               (!criteria.status || caseItem.status === criteria.status) &&
               (!criteria.dateFrom || new Date(caseItem.fileDate) >= new Date(criteria.dateFrom)) &&
               (!criteria.dateTo || new Date(caseItem.fileDate) <= new Date(criteria.dateTo)) &&
               (caseItem.amount >= criteria.amountFrom && caseItem.amount <= criteria.amountTo);
    });
}

// البحث المتقدم في المدعى عليهم
function searchDefendantsAdvanced() {
    const criteria = {
        name: document.getElementById('search-defendant-full-name').value.trim(),
        phone: document.getElementById('search-defendant-phone').value.trim(),
        email: document.getElementById('search-defendant-email').value.trim(),
        workplace: document.getElementById('search-defendant-workplace').value.trim()
    };
    
    return dataManager.defendantsData.filter(defendant => {
        return (!criteria.name || defendant.name.toLowerCase().includes(criteria.name.toLowerCase())) &&
               (!criteria.phone || defendant.phone.includes(criteria.phone)) &&
               (!criteria.email || defendant.email.toLowerCase().includes(criteria.email.toLowerCase())) &&
               (!criteria.workplace || defendant.workplace.toLowerCase().includes(criteria.workplace.toLowerCase()));
    });
}

// البحث المتقدم في المحامين
function searchLawyersAdvanced() {
    const criteria = {
        name: document.getElementById('search-lawyer-name').value.trim(),
        license: document.getElementById('search-lawyer-license').value.trim(),
        specialization: document.getElementById('search-lawyer-specialization').value,
        experience: parseInt(document.getElementById('search-lawyer-experience').value) || 0
    };
    
    return dataManager.lawyersData.filter(lawyer => {
        return (!criteria.name || lawyer.name.toLowerCase().includes(criteria.name.toLowerCase())) &&
               (!criteria.license || lawyer.license.toLowerCase().includes(criteria.license.toLowerCase())) &&
               (!criteria.specialization || lawyer.specialization === criteria.specialization) &&
               (lawyer.experience >= criteria.experience);
    });
}

// البحث المتقدم في الاستقطاعات
function searchDeductionsAdvanced() {
    const criteria = {
        caseNumber: document.getElementById('search-deduction-case').value.trim(),
        source: document.getElementById('search-deduction-source').value,
        amountFrom: parseInt(document.getElementById('search-deduction-amount-from').value) || 0,
        amountTo: parseInt(document.getElementById('search-deduction-amount-to').value) || Infinity,
        dateFrom: document.getElementById('search-deduction-date-from').value,
        dateTo: document.getElementById('search-deduction-date-to').value
    };
    
    return dataManager.deductionsData.filter(deduction => {
        return (!criteria.caseNumber || deduction.caseNumber.toLowerCase().includes(criteria.caseNumber.toLowerCase())) &&
               (!criteria.source || deduction.source === criteria.source) &&
               (deduction.amount >= criteria.amountFrom && deduction.amount <= criteria.amountTo) &&
               (!criteria.dateFrom || new Date(deduction.date) >= new Date(criteria.dateFrom)) &&
               (!criteria.dateTo || new Date(deduction.date) <= new Date(criteria.dateTo));
    });
}

// عرض نتائج البحث
function displaySearchResults(results, tabId) {
    const resultsContainer = document.getElementById('search-results');
    const resultsContent = document.getElementById('search-results-content');
    
    if (results.length === 0) {
        resultsContent.innerHTML = '<p style="text-align: center; color: var(--gray-500); padding: 2rem;">لم يتم العثور على نتائج تطابق معايير البحث</p>';
    } else {
        let html = '';
        
        if (tabId === 'search-cases-tab') {
            html = results.map(caseItem => `
                <div style="padding: 1rem; border: 1px solid var(--gray-200); border-radius: 0.5rem; margin-bottom: 1rem; background: white;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="color: var(--primary-blue);">${caseItem.caseNumber}</strong> - ${caseItem.plaintiffName}
                            <br>
                            <small style="color: var(--gray-600);">المدعى عليه: ${caseItem.defendantName} | المبلغ: ${dataManager.formatNumber(caseItem.amount)} د.ع</small>
                        </div>
                        <div style="text-align: left;">
                            <span class="status-badge ${getStatusBadgeClass(caseItem.status)}">${caseItem.status}</span>
                            <br>
                            <button class="btn btn-primary" style="margin-top: 0.5rem; padding: 0.25rem 0.75rem; font-size: 0.75rem;" onclick="viewCaseFromSearch(${caseItem.id})">عرض</button>
                        </div>
                    </div>
                </div>
            `).join('');
        } else if (tabId === 'search-defendants-tab') {
            html = results.map(defendant => `
                <div style="padding: 1rem; border: 1px solid var(--gray-200); border-radius: 0.5rem; margin-bottom: 1rem; background: white;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="color: var(--indigo);">${defendant.name}</strong>
                            <br>
                            <small style="color: var(--gray-600);">الهاتف: ${defendant.phone || 'غير محدد'} | الدعاوى: ${defendant.casesCount}</small>
                        </div>
                        <button class="btn btn-primary" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;" onclick="viewDefendantFromSearch(${defendant.id})">عرض</button>
                    </div>
                </div>
            `).join('');
        } else if (tabId === 'search-lawyers-tab') {
            html = results.map(lawyer => `
                <div style="padding: 1rem; border: 1px solid var(--gray-200); border-radius: 0.5rem; margin-bottom: 1rem; background: white;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="color: var(--success-green);">${lawyer.name}</strong>
                            <br>
                            <small style="color: var(--gray-600);">الترخيص: ${lawyer.license} | التخصص: ${lawyer.specialization}</small>
                        </div>
                        <button class="btn btn-primary" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;" onclick="viewLawyerFromSearch(${lawyer.id})">عرض</button>
                    </div>
                </div>
            `).join('');
        } else if (tabId === 'search-deductions-tab') {
            html = results.map(deduction => `
                <div style="padding: 1rem; border: 1px solid var(--gray-200); border-radius: 0.5rem; margin-bottom: 1rem; background: white;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="color: var(--warning-yellow);">${deduction.caseNumber}</strong> - ${deduction.plaintiffName}
                            <br>
                            <small style="color: var(--gray-600);">المبلغ: ${dataManager.formatNumber(deduction.amount)} د.ع | التاريخ: ${dataManager.formatDate(deduction.date)}</small>
                        </div>
                        <button class="btn btn-primary" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;" onclick="viewDeductionFromSearch(${deduction.id})">عرض</button>
                    </div>
                </div>
            `).join('');
        }
        
        resultsContent.innerHTML = html;
    }
    
    resultsContainer.style.display = 'block';
    
    // إضافة معلومات الإحصائيات
    const statsHtml = `
        <div style="background: var(--primary-blue-light); padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; text-align: center;">
            <strong style="color: var(--primary-blue);">تم العثور على ${results.length} نتيجة</strong>
        </div>
    `;
    resultsContent.insertAdjacentHTML('afterbegin', statsHtml);
}

// عرض الدعوى من نتائج البحث
function viewCaseFromSearch(caseId) {
    closeModal(document.querySelector('.modal-close'));
    showCaseDetails(caseId);
}

// عرض المدعى عليه من نتائج البحث
function viewDefendantFromSearch(defendantId) {
    closeModal(document.querySelector('.modal-close'));
    viewDefendant(defendantId);
}

// عرض المحامي من نتائج البحث
function viewLawyerFromSearch(lawyerId) {
    closeModal(document.querySelector('.modal-close'));
    viewLawyer(lawyerId);
}

// عرض الاستقطاع من نتائج البحث
function viewDeductionFromSearch(deductionId) {
    closeModal(document.querySelector('.modal-close'));
    viewDeduction(deductionId);
}

// ===================================================================
// 6. وظائف النسخ الاحتياطية المتقدمة
// ===================================================================

// إظهار مدير النسخ الاحتياطية
async function showBackupManager() {
    let backups = [];
    
    if (window.electronAPI) {
        try {
            const result = await window.electronAPI.listBackups();
            if (result.success) {
                backups = result.backups;
            }
        } catch (error) {
            console.error('خطأ في تحميل قائمة النسخ الاحتياطية:', error);
        }
    }
    
    const content = `
        <div class="backup-manager">
            <div style="margin-bottom: 2rem;">
                <h4 style="margin-bottom: 1rem; color: var(--primary-blue);">
                    <i class="fas fa-shield-alt"></i>
                    إدارة النسخ الاحتياطية
                </h4>
                <p style="color: var(--gray-600); margin-bottom: 1.5rem;">
                    يمكنك إنشاء واستعادة النسخ الاحتياطية من بياناتك لضمان حفظها بأمان.
                </p>
                
                <div style="display: flex; gap: 1rem; margin-bottom: 2rem;">
                    <button class="btn btn-primary" onclick="createManualBackup()">
                        <i class="fas fa-plus"></i>
                        إنشاء نسخة احتياطية جديدة
                    </button>
                    <button class="btn btn-secondary" onclick="importBackupFile()">
                        <i class="fas fa-upload"></i>
                        استيراد نسخة احتياطية
                    </button>
                </div>
            </div>

            <div class="backup-settings" style="background: var(--gray-50); padding: 1.5rem; border-radius: 0.75rem; margin-bottom: 2rem;">
                <h5 style="margin-bottom: 1rem; color: var(--gray-700);">إعدادات النسخ الاحتياطية التلقائية</h5>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <input type="checkbox" id="auto-backup-enabled" ${dataManager.settingsData.autoBackup ? 'checked' : ''}>
                            تفعيل النسخ الاحتياطية التلقائية
                        </label>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; color: var(--gray-700);">فترة النسخ (بالساعات)</label>
                        <input type="number" id="backup-interval" value="${dataManager.settingsData.backupInterval || 24}" min="1" max="168" style="width: 100%; padding: 0.5rem; border: 1px solid var(--gray-300); border-radius: 0.5rem;">
                    </div>
                </div>
                <button class="btn btn-success" style="margin-top: 1rem;" onclick="saveBackupSettings()">
                    <i class="fas fa-save"></i>
                    حفظ الإعدادات
                </button>
            </div>

            <div class="backups-list">
                <h5 style="margin-bottom: 1rem; color: var(--gray-700);">النسخ الاحتياطية المتاحة (${backups.length})</h5>
                <div id="backups-container" style="max-height: 300px; overflow-y: auto;">
                    ${backups.length === 0 ? 
                        '<div style="text-align: center; padding: 2rem; color: var(--gray-500);">لا توجد نسخ احتياطية متاحة</div>' :
                        backups.map(backup => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border: 1px solid var(--gray-200); border-radius: 0.5rem; margin-bottom: 1rem; background: white;">
                                <div>
                                    <strong style="color: var(--primary-blue);">${backup.filename}</strong>
                                    <br>
                                    <small style="color: var(--gray-600);">تاريخ الإنشاء: ${new Date(backup.timestamp.replace(/-/g, ':')).toLocaleString('ar-SA')}</small>
                                </div>
                                <div style="display: flex; gap: 0.5rem;">
                                    <button class="btn btn-success" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;" onclick="restoreSpecificBackup('${backup.path}')">
                                        <i class="fas fa-undo"></i>
                                        استعادة
                                    </button>
                                    <button class="btn btn-danger" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;" onclick="deleteBackup('${backup.path}')">
                                        <i class="fas fa-trash"></i>
                                        حذف
                                    </button>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        </div>
    `;

    const actions = `
        <button class="btn btn-secondary" onclick="closeModal(this)">إغلاق</button>
    `;

    createModal('مدير النسخ الاحتياطية', content, actions);
}

// إنشاء نسخة احتياطية يدوية
async function createManualBackup() {
    try {
        const allData = {
            cases: dataManager.casesData,
            defendants: dataManager.defendantsData,
            lawyers: dataManager.lawyersData,
            deductions: dataManager.deductionsData,
            notifications: dataManager.notificationsData,
            settings: dataManager.settingsData
        };

        if (window.electronAPI) {
            const result = await window.electronAPI.createBackup(allData);
            if (result.success) {
                showNotification('تم الإنشاء', `تم إنشاء النسخة الاحتياطية: ${result.filename}`, 'success');
                
                // إعادة تحميل قائمة النسخ الاحتياطية
                closeModal(document.querySelector('.modal-close'));
                setTimeout(() => showBackupManager(), 500);
            } else {
                showNotification('خطأ', 'فشل في إنشاء النسخة الاحتياطية', 'error');
            }
        } else {
            // للمتصفح العادي
            const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showNotification('تم الإنشاء', 'تم إنشاء النسخة الاحتياطية وتحميلها', 'success');
        }
    } catch (error) {
        console.error('خطأ في إنشاء النسخة الاحتياطية:', error);
        showNotification('خطأ', 'حدث خطأ أثناء إنشاء النسخة الاحتياطية', 'error');
    }
}

// استيراد ملف نسخة احتياطية
function importBackupFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async function(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const reader = new FileReader();
            reader.onload = async function(e) {
                try {
                    const backupData = JSON.parse(e.target.result);
                    await restoreFromBackupData(backupData);
                } catch (error) {
                    showNotification('خطأ', 'ملف النسخة الاحتياطية غير صالح', 'error');
                }
            };
            reader.readAsText(file);
        } catch (error) {
            console.error('خطأ في قراءة ملف النسخة الاحتياطية:', error);
            showNotification('خطأ', 'فشل في قراءة ملف النسخة الاحتياطية', 'error');
        }
    };
    input.click();
}

// استعادة نسخة احتياطية محددة
async function restoreSpecificBackup(backupPath) {
    if (!confirm('هل أنت متأكد من استعادة هذه النسخة الاحتياطية؟ سيتم استبدال البيانات الحالية.')) {
        return;
    }

    try {
        if (window.electronAPI) {
            const result = await window.electronAPI.loadFile(backupPath);
            if (result.success) {
                const backupData = JSON.parse(result.data);
                await restoreFromBackupData(backupData);
            } else {
                showNotification('خطأ', 'فشل في تحميل النسخة الاحتياطية', 'error');
            }
        }
    } catch (error) {
        console.error('خطأ في استعادة النسخة الاحتياطية:', error);
        showNotification('خطأ', 'حدث خطأ أثناء استعادة النسخة الاحتياطية', 'error');
    }
}

// استعادة البيانات من النسخة الاحتياطية
async function restoreFromBackupData(backupData) {
    try {
        // التحقق من بنية البيانات
        if (backupData.data) {
            // النسخة الاحتياطية الحديثة
            const data = backupData.data;
            if (data.cases) dataManager.casesData = data.cases;
            if (data.defendants) dataManager.defendantsData = data.defendants;
            if (data.lawyers) dataManager.lawyersData = data.lawyers;
            if (data.deductions) dataManager.deductionsData = data.deductions;
            if (data.notifications) dataManager.notificationsData = data.notifications;
            if (data.settings) dataManager.settingsData = { ...dataManager.getDefaultSettings(), ...data.settings };
        } else {
            // النسخة الاحتياطية القديمة
            if (backupData.cases) dataManager.casesData = backupData.cases;
            if (backupData.defendants) dataManager.defendantsData = backupData.defendants;
            if (backupData.lawyers) dataManager.lawyersData = backupData.lawyers;
            if (backupData.deductions) dataManager.deductionsData = backupData.deductions;
            if (backupData.notifications) dataManager.notificationsData = backupData.notifications;
            if (backupData.settings) dataManager.settingsData = { ...dataManager.getDefaultSettings(), ...backupData.settings };
        }

        // تحديث البيانات المفلترة
        dataManager.filteredCases = [...dataManager.casesData];
        dataManager.filteredDefendants = [...dataManager.defendantsData];
        dataManager.filteredLawyers = [...dataManager.lawyersData];
        dataManager.filteredDeductions = [...dataManager.deductionsData];

        // حفظ البيانات المستعادة
        await dataManager.saveData();

        // إعادة رسم جميع الواجهات
        renderCasesTable();
        renderDefendantsTable();
        renderLawyersTable();
        renderDeductionsTable();
        updateDashboardStats();
        renderUpcomingHearings();
        renderAlerts();
        updateLawyerSelector();

        closeModal(document.querySelector('.modal-close'));
        showNotification('تم الاستعادة', 'تم استعادة البيانات من النسخة الاحتياطية بنجاح', 'success');

        // إضافة إشعار
        dataManager.addNotification({
            title: 'استعادة نسخة احتياطية',
            message: `تم استعادة البيانات من النسخة الاحتياطية بتاريخ ${new Date().toLocaleDateString('ar-SA')}`,
            type: 'success'
        });

    } catch (error) {
        console.error('خطأ في استعادة البيانات:', error);
        showNotification('خطأ', 'حدث خطأ أثناء استعادة البيانات', 'error');
    }
}

// حذف نسخة احتياطية
async function deleteBackup(backupPath) {
    if (!confirm('هل أنت متأكد من حذف هذه النسخة الاحتياطية؟')) {
        return;
    }

    try {
        const fs = require('fs').promises;
        await fs.unlink(backupPath);
        
        showNotification('تم الحذف', 'تم حذف النسخة الاحتياطية بنجاح', 'success');
        
        // إعادة تحميل قائمة النسخ الاحتياطية
        closeModal(document.querySelector('.modal-close'));
        setTimeout(() => showBackupManager(), 500);
    } catch (error) {
        console.error('خطأ في حذف النسخة الاحتياطية:', error);
        showNotification('خطأ', 'فشل في حذف النسخة الاحتياطية', 'error');
    }
}

// حفظ إعدادات النسخ الاحتياطية
function saveBackupSettings() {
    const autoBackupEnabled = document.getElementById('auto-backup-enabled').checked;
    const backupInterval = parseInt(document.getElementById('backup-interval').value) || 24;

    const settings = {
        autoBackup: autoBackupEnabled,
        backupInterval: backupInterval
    };

    dataManager.updateSettings(settings);

    // تحديث جدولة النسخ الاحتياطية التلقائية
    if (autoBackupEnabled) {
        dataManager.scheduleAutoBackup();
        if (window.electronAPI) {
            window.electronAPI.scheduleAutoBackup(backupInterval * 60);
        }
    } else {
        if (dataManager.autoBackupInterval) {
            clearInterval(dataManager.autoBackupInterval);
            dataManager.autoBackupInterval = null;
        }
        if (window.electronAPI) {
            window.electronAPI.clearAutoBackup();
        }
    }

    showNotification('تم الحفظ', 'تم حفظ إعدادات النسخ الاحتياطية بنجاح', 'success');
}

// ===================================================================
// 7. وظائف التطبيق الإضافية
// ===================================================================

// دليل المستخدم
function showUserGuide() {
    const content = `
        <div style="max-height: 70vh; overflow-y: auto;">
            <div class="user-guide">
                <h3 style="color: var(--primary-blue); margin-bottom: 2rem; text-align: center;">
                    <i class="fas fa-book"></i>
                    دليل استخدام نظام إدارة الدعاوى القضائية
                </h3>

                <div class="guide-section" style="margin-bottom: 2rem;">
                    <h4 style="color: var(--success-green); margin-bottom: 1rem;">
                        <i class="fas fa-play-circle"></i>
                        البدء السريع
                    </h4>
                    <ol style="color: var(--gray-700); line-height: 1.8;">
                        <li>ابدأ بإضافة المحامين من تبويب "المحامون"</li>
                        <li>أضف المدعى عليهم من تبويب "المدعى عليهم"</li>
                        <li>أنشئ دعوى جديدة من تبويب "إدارة الدعاوى"</li>
                        <li>تابع تطور الدعوى وأضف الاستقطاعات عند الحاجة</li>
                        <li>استخدم التقارير لمتابعة الأداء العام</li>
                    </ol>
                </div>

                <div class="guide-section" style="margin-bottom: 2rem;">
                    <h4 style="color: var(--warning-yellow); margin-bottom: 1rem;">
                        <i class="fas fa-keyboard"></i>
                        اختصارات لوحة المفاتيح
                    </h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; background: var(--gray-50); padding: 1rem; border-radius: 0.5rem;">
                        <div><strong>Ctrl+N:</strong> دعوى جديدة</div>
                        <div><strong>Ctrl+S:</strong> حفظ</div>
                        <div><strong>Ctrl+F:</strong> بحث</div>
                        <div><strong>Ctrl+P:</strong> طباعة</div>
                        <div><strong>F11:</strong> ملء الشاشة</div>
                        <div><strong>Ctrl+R:</strong> إعادة تحميل</div>
                    </div>
                </div>

                <div class="guide-section" style="margin-bottom: 2rem;">
                    <h4 style="color: var(--error-red); margin-bottom: 1rem;">
                        <i class="fas fa-lightbulb"></i>
                        نصائح مهمة
                    </h4>
                    <ul style="color: var(--gray-700); line-height: 1.8;">
                        <li>احرص على إنشاء نسخ احتياطية دورية من البيانات</li>
                        <li>استخدم أرقام دعاوى واضحة ومنتظمة لسهولة المتابعة</li>
                        <li>حدث حالة الدعوى باستمرار لضمان دقة الإحصائيات</li>
                        <li>أضف الملاحظات المهمة في كل مرحلة من مراحل الدعوى</li>
                        <li>استخدم البحث المتقدم للعثور على الدعاوى بسرعة</li>
                    </ul>
                </div>

                <div class="guide-section" style="margin-bottom: 2rem;">
                    <h4 style="color: var(--indigo); margin-bottom: 1rem;">
                        <i class="fas fa-shield-alt"></i>
                        الأمان والحماية
                    </h4>
                    <div style="background: var(--indigo-light); padding: 1rem; border-radius: 0.5rem;">
                        <p style="margin: 0; color: var(--gray-700);">
                            يتم حفظ جميع البيانات محلياً على جهازك، ولا يتم إرسالها لأي خوادم خارجية. 
                            تأكد من إنشاء نسخ احتياطية منتظمة وحفظها في مكان آمن.
                        </p>
                    </div>
                </div>

                <div class="guide-section">
                    <h4 style="color: var(--purple); margin-bottom: 1rem;">
                        <i class="fas fa-headset"></i>
                        الدعم الفني
                    </h4>
                    <div style="background: var(--purple-light); padding: 1rem; border-radius: 0.5rem;">
                        <p style="margin: 0; color: var(--gray-700);">
                            في حالة مواجهة أي مشاكل أو الحاجة للمساعدة، يرجى التواصل مع فريق الدعم الفني 
                            أو مراجعة ملف المساعدة المرفق مع التطبيق.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;

    const actions = `
        <button class="btn btn-primary" onclick="closeModal(this)">فهمت</button>
    `;

    createModal('دليل المستخدم', content, actions);
}

// إظهار الإحصائيات المفصلة
function showDetailedStatistics() {
    const stats = dataManager.getStatistics();
    
    // حساب إحصائيات إضافية
    const casesByPriority = dataManager.casesData.reduce((acc, c) => {
        acc[c.priority] = (acc[c.priority] || 0) + 1;
        return acc;
    }, {});
    
    const casesByStatus = dataManager.casesData.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
    }, {});
    
    const lawyersBySpecialization = dataManager.lawyersData.reduce((acc, l) => {
        acc[l.specialization] = (acc[l.specialization] || 0) + 1;
        return acc;
    }, {});

    const monthlyDeductions = dataManager.deductionsData.reduce((acc, d) => {
        const month = new Date(d.date).toISOString().substring(0, 7);
        acc[month] = (acc[month] || 0) + d.amount;
        return acc;
    }, {});

    const content = `
        <div style="max-height: 70vh; overflow-y: auto;">
            <div class="detailed-stats">
                <h3 style="color: var(--primary-blue); margin-bottom: 2rem; text-align: center;">
                    <i class="fas fa-chart-bar"></i>
                    الإحصائيات المفصلة
                </h3>

                <div class="stats-section" style="margin-bottom: 2rem;">
                    <h4 style="color: var(--success-green); margin-bottom: 1rem;">توزيع الدعاوى حسب الأولوية</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
                        ${Object.entries(casesByPriority).map(([priority, count]) => `
                            <div style="background: var(--gray-50); padding: 1rem; border-radius: 0.5rem; text-align: center;">
                                <div style="font-size: 1.5rem; font-weight: 800; color: var(--primary-blue);">${count}</div>
                                <div style="color: var(--gray-600);">${priority}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="stats-section" style="margin-bottom: 2rem;">
                    <h4 style="color: var(--warning-yellow); margin-bottom: 1rem;">توزيع الدعاوى حسب الحالة</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        ${Object.entries(casesByStatus).map(([status, count]) => `
                            <div style="background: var(--warning-yellow-light); padding: 1rem; border-radius: 0.5rem; text-align: center;">
                                <div style="font-size: 1.5rem; font-weight: 800; color: var(--warning-yellow);">${count}</div>
                                <div style="color: var(--gray-600);">${status}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="stats-section" style="margin-bottom: 2rem;">
                    <h4 style="color: var(--indigo); margin-bottom: 1rem;">توزيع المحامين حسب التخصص</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        ${Object.entries(lawyersBySpecialization).map(([specialization, count]) => `
                            <div style="background: var(--indigo-light); padding: 1rem; border-radius: 0.5rem; text-align: center;">
                                <div style="font-size: 1.5rem; font-weight: 800; color: var(--indigo);">${count}</div>
                                <div style="color: var(--gray-600);">${specialization}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="stats-section" style="margin-bottom: 2rem;">
                    <h4 style="color: var(--purple); margin-bottom: 1rem;">الاستقطاعات الشهرية</h4>
                    <div style="background: var(--purple-light); padding: 1rem; border-radius: 0.5rem;">
                        ${Object.keys(monthlyDeductions).length === 0 ? 
                            '<p style="text-align: center; color: var(--gray-500);">لا توجد استقطاعات مسجلة</p>' :
                            Object.entries(monthlyDeductions)
                                .sort(([a], [b]) => b.localeCompare(a))
                                .slice(0, 6)
                                .map(([month, amount]) => `
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                        <span style="color: var(--gray-700);">${new Date(month).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' })}</span>
                                        <strong style="color: var(--purple);">${dataManager.formatNumber(amount)} د.ع</strong>
                                    </div>
                                `).join('')
                        }
                    </div>
                </div>

                <div class="stats-section">
                    <h4 style="color: var(--error-red); margin-bottom: 1rem;">إحصائيات إضافية</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        <div style="background: var(--error-red-light); padding: 1rem; border-radius: 0.5rem; text-align: center;">
                            <div style="font-size: 1.5rem; font-weight: 800; color: var(--error-red);">${dataManager.defendantsData.length}</div>
                            <div style="color: var(--gray-600);">إجمالي المدعى عليهم</div>
                        </div>
                        <div style="background: var(--success-green-light); padding: 1rem; border-radius: 0.5rem; text-align: center;">
                            <div style="font-size: 1.5rem; font-weight: 800; color: var(--success-green);">${dataManager.lawyersData.length}</div>
                            <div style="color: var(--gray-600);">إجمالي المحامين</div>
                        </div>
                        <div style="background: var(--warning-yellow-light); padding: 1rem; border-radius: 0.5rem; text-align: center;">
                            <div style="font-size: 1.5rem; font-weight: 800; color: var(--warning-yellow);">${dataManager.deductionsData.length}</div>
                            <div style="color: var(--gray-600);">إجمالي الاستقطاعات</div>
                        </div>
                        <div style="background: var(--primary-blue-light); padding: 1rem; border-radius: 0.5rem; text-align: center;">
                            <div style="font-size: 1.5rem; font-weight: 800; color: var(--primary-blue);">${dataManager.notificationsData.length}</div>
                            <div style="color: var(--gray-600);">إجمالي الإشعارات</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const actions = `
        <button class="btn btn-secondary" onclick="closeModal(this)">إغلاق</button>
        <button class="btn btn-primary" onclick="exportDetailedStats()">
            <i class="fas fa-download"></i>
            تصدير الإحصائيات
        </button>
    `;

    createModal('الإحصائيات المفصلة', content, actions);
}

// تصدير الإحصائيات المفصلة
async function exportDetailedStats() {
    const stats = dataManager.getStatistics();
    
    const detailedStats = {
        generatedDate: new Date().toISOString(),
        summary: stats,
        casesByPriority: dataManager.casesData.reduce((acc, c) => {
            acc[c.priority] = (acc[c.priority] || 0) + 1;
            return acc;
        }, {}),
        casesByStatus: dataManager.casesData.reduce((acc, c) => {
            acc[c.status] = (acc[c.status] || 0) + 1;
            return acc;
        }, {}),
        lawyersBySpecialization: dataManager.lawyersData.reduce((acc, l) => {
            acc[l.specialization] = (acc[l.specialization] || 0) + 1;
            return acc;
        }, {}),
        monthlyDeductions: dataManager.deductionsData.reduce((acc, d) => {
            const month = new Date(d.date).toISOString().substring(0, 7);
            acc[month] = (acc[month] || 0) + d.amount;
            return acc;
        }, {}),
        totals: {
            defendants: dataManager.defendantsData.length,
            lawyers: dataManager.lawyersData.length,
            deductions: dataManager.deductionsData.length,
            notifications: dataManager.notificationsData.length
        }
    };

    if (window.electronAPI) {
        try {
            const result = await window.electronAPI.exportData(detailedStats);
            if (result.success) {
                closeModal(document.querySelector('.modal-close'));
                showNotification('تم التصدير', 'تم تصدير الإحصائيات المفصلة بنجاح', 'success');
            }
        } catch (error) {
            showNotification('خطأ', 'فشل في تصدير الإحصائيات', 'error');
        }
    } else {
        const blob = new Blob([JSON.stringify(detailedStats, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `detailed-statistics-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        closeModal(document.querySelector('.modal-close'));
        showNotification('تم التصدير', 'تم تصدير الإحصائيات المفصلة بنجاح', 'success');
    }
}

// ===================================================================
// 8. معالجات الأحداث والتهيئة
// ===================================================================

// إعداد معالجات الأحداث المحسنة
function setupEnhancedEventHandlers() {
    // معالجة أحداث Electron
    if (window.electronAPI) {
        // حدث البيانات جاهزة
        document.addEventListener('electronReady', async () => {
            console.log('Electron API ready');
            
            // تحميل البيانات من Electron
            try {
                const result = await window.electronAPI.loadAppData();
                if (result.success && result.data) {
                    await dataManager.loadData();
                    initializeApplication();
                } else {
                    initializeApplication();
                }
            } catch (error) {
                console.error('خطأ في تحميل البيانات من Electron:', error);
                initializeApplication();
            }
        });

        // أحداث النوافذ
        document.addEventListener('windowMaximized', () => {
            console.log('النافذة مكبرة');
        });

        document.addEventListener('windowUnmaximized', () => {
            console.log('النافذة مستعادة');
        });

        // أحداث التطبيق
        document.addEventListener('newCase', () => {
            showNewCaseModal();
        });

        document.addEventListener('saveData', async () => {
            await dataManager.saveData();
            showNotification('تم الحفظ', 'تم حفظ البيانات بنجاح', 'success');
        });

        document.addEventListener('createBackup', async (event) => {
            const filePath = event.detail.filePath;
            const allData = {
                cases: dataManager.casesData,
                defendants: dataManager.defendantsData,
                lawyers: dataManager.lawyersData,
                deductions: dataManager.deductionsData,
                notifications: dataManager.notificationsData,
                settings: dataManager.settingsData
            };
            
            try {
                const result = await window.electronAPI.saveFile(filePath, JSON.stringify(allData, null, 2));
                if (result.success) {
                    showNotification('تم الإنشاء', 'تم إنشاء النسخة الاحتياطية بنجاح', 'success');
                } else {
                    showNotification('خطأ', 'فشل في إنشاء النسخة الاحتياطية', 'error');
                }
            } catch (error) {
                console.error('خطأ في إنشاء النسخة الاحتياطية:', error);
                showNotification('خطأ', 'حدث خطأ أثناء إنشاء النسخة الاحتياطية', 'error');
            }
        });

        document.addEventListener('restoreBackup', async (event) => {
            const filePath = event.detail.filePath;
            
            try {
                const result = await window.electronAPI.loadFile(filePath);
                if (result.success) {
                    const backupData = JSON.parse(result.data);
                    await restoreFromBackupData(backupData);
                } else {
                    showNotification('خطأ', 'فشل في تحميل النسخة الاحتياطية', 'error');
                }
            } catch (error) {
                console.error('خطأ في استعادة النسخة الاحتياطية:', error);
                showNotification('خطأ', 'حدث خطأ أثناء استعادة النسخة الاحتياطية', 'error');
            }
        });

        document.addEventListener('generateComprehensiveReport', () => {
            generateComprehensiveReport();
        });

        document.addEventListener('showDetailedStatistics', () => {
            showDetailedStatistics();
        });

        document.addEventListener('globalSearch', () => {
            showAdvancedSearch();
        });

        document.addEventListener('showUserGuide', () => {
            showUserGuide();
        });

        document.addEventListener('saveBeforeClose', async () => {
            await dataManager.saveData();
            console.log('تم حفظ البيانات قبل الإغلاق');
        });

        // النسخ الاحتياطية التلقائية
        document.addEventListener('autoBackupRequested', async () => {
            await dataManager.createAutoBackup();
        });
    }

    // أحداث لوحة المفاتيح
    document.addEventListener('keydown', (event) => {
        // Ctrl+N - دعوى جديدة
        if (event.ctrlKey && event.key === 'n') {
            event.preventDefault();
            showNewCaseModal();
        }
        
        // Ctrl+S - حفظ
        if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            dataManager.saveData();
            showNotification('تم الحفظ', 'تم حفظ البيانات بنجاح', 'success');
        }
        
        // Ctrl+F - بحث
        if (event.ctrlKey && event.key === 'f') {
            event.preventDefault();
            showAdvancedSearch();
        }
        
        // Ctrl+P - طباعة
        if (event.ctrlKey && event.key === 'p') {
            event.preventDefault();
            if (window.electronAPI) {
                window.electronAPI.printView();
            } else {
                window.print();
            }
        }
        
        // F11 - ملء الشاشة
        if (event.key === 'F11') {
            event.preventDefault();
            toggleMaximize();
        }
        
        // Escape - إغلاق النوافذ المنبثقة
        if (event.key === 'Escape') {
            const modal = document.querySelector('.modal-overlay.active');
            if (modal) {
                modal.classList.remove('active');
                setTimeout(() => {
                    if (document.body.contains(modal)) {
                        document.body.removeChild(modal);
                    }
                }, 300);
            }
        }
    });

    // أحداث الأداء
    window.addEventListener('beforeunload', async (event) => {
        // حفظ البيانات قبل إغلاق التطبيق
        if (dataManager) {
            await dataManager.saveData();
        }
    });

    // أحداث الشبكة
    window.addEventListener('online', () => {
        showNotification('متصل', 'تم استعادة الاتصال بالإنترنت', 'success');
    });

    window.addEventListener('offline', () => {
        showNotification('غير متصل', 'انقطع الاتصال بالإنترنت - ستستمر البيانات في العمل محلياً', 'warning');
    });
}

// تهيئة التطبيق الكاملة
function initializeApplication() {
    console.log('بدء تهيئة التطبيق...');
    
    // إصلاح أزرار النافذة
    fixWindowControls();
    
    // إنشاء مدير البيانات المحسن
    window.dataManager = new EnhancedDataManager();
    
    // إعداد معالجات الأحداث
    setupEnhancedEventHandlers();
    
    // تحديث الواجهة
    updateDashboardStats();
    renderUpcomingHearings();
    renderAlerts();
    dataManager.updateNotificationBadge();
    
    // رسم الجداول
    renderCasesTable();
    renderDefendantsTable();
    renderLawyersTable();
    renderDeductionsTable();
    updateLawyerSelector();
    
    // إعداد الحفظ التلقائي
    if (dataManager.settingsData.autoSave) {
        setInterval(async () => {
            await dataManager.saveData();
            console.log('حفظ تلقائي تم بنجاح');
        }, (dataManager.settingsData.autoSaveInterval || 5) * 60000);
    }
    
    // إعداد النسخ الاحتياطية التلقائية
    if (dataManager.settingsData.autoBackup) {
        dataManager.initializeBackupSystem();
    }
    
    console.log('تم تهيئة التطبيق بنجاح');
    showNotification('مرحباً', 'مرحباً بك في نظام إدارة الدعاوى القضائية المحدث', 'success');
}

// ===================================================================
// 9. وظائف المساعدة والأدوات المساعدة
// ===================================================================

// تنظيف البيانات وإصلاحها
function cleanupAndRepairData() {
    console.log('بدء تنظيف وإصلاح البيانات...');
    
    let repairCount = 0;
    
    // إصلاح الدعاوى
    dataManager.casesData.forEach(caseItem => {
        if (!caseItem.id) {
            caseItem.id = dataManager.generateId('case');
            repairCount++;
        }
        if (!caseItem.timeline) {
            caseItem.timeline = [{
                date: caseItem.fileDate,
                title: 'تم رفع الدعوى',
                desc: 'تم تقديم الدعوى للمحكمة',
                type: 'blue'
            }];
            repairCount++;
        }
        if (!caseItem.deductions) {
            caseItem.deductions = 0;
            repairCount++;
        }
    });
    
    // إصلاح المدعى عليهم
    dataManager.defendantsData.forEach(defendant => {
        if (!defendant.id) {
            defendant.id = dataManager.generateId('defendant');
            repairCount++;
        }
        if (!defendant.casesCount) {
            defendant.casesCount = dataManager.casesData.filter(c => c.defendantName === defendant.name).length;
            repairCount++;
        }
    });
    
    // إصلاح المحامين
    dataManager.lawyersData.forEach(lawyer => {
        if (!lawyer.id) {
            lawyer.id = dataManager.generateId('lawyer');
            repairCount++;
        }
        if (!lawyer.casesCount) {
            lawyer.casesCount = dataManager.casesData.filter(c => c.lawyerName === lawyer.name).length;
            repairCount++;
        }
    });
    
    // إصلاح الاستقطاعات
    dataManager.deductionsData.forEach(deduction => {
        if (!deduction.id) {
            deduction.id = dataManager.generateId('deduction');
            repairCount++;
        }
        if (!deduction.status) {
            deduction.status = 'مستلم';
            repairCount++;
        }
    });
    
    // إصلاح الإشعارات
    dataManager.notificationsData.forEach(notification => {
        if (!notification.id) {
            notification.id = dataManager.generateId('notification');
            repairCount++;
        }
        if (notification.read === undefined) {
            notification.read = false;
            repairCount++;
        }
    });
    
    if (repairCount > 0) {
        dataManager.saveData();
        console.log(`تم إصلاح ${repairCount} عنصر في البيانات`);
        showNotification('تم الإصلاح', `تم إصلاح ${repairCount} عنصر في البيانات`, 'success');
    } else {
        console.log('البيانات سليمة ولا تحتاج إصلاح');
    }
}

// فحص سلامة البيانات
function validateDataIntegrity() {
    const issues = [];
    
    // فحص الدعاوى
    dataManager.casesData.forEach((caseItem, index) => {
        if (!caseItem.caseNumber) issues.push(`الدعوى ${index + 1}: رقم الدعوى مفقود`);
        if (!caseItem.plaintiffName) issues.push(`الدعوى ${index + 1}: اسم المدعي مفقود`);
        if (!caseItem.defendantName) issues.push(`الدعوى ${index + 1}: اسم المدعى عليه مفقود`);
        if (!caseItem.amount || caseItem.amount <= 0) issues.push(`الدعوى ${index + 1}: مبلغ الدعوى غير صحيح`);
    });
    
    // فحص تطابق الاستقطاعات مع الدعاوى
    dataManager.deductionsData.forEach((deduction, index) => {
        const relatedCase = dataManager.casesData.find(c => c.caseNumber === deduction.caseNumber);
        if (!relatedCase) {
            issues.push(`الاستقطاع ${index + 1}: لا توجد دعوى مطابقة لرقم ${deduction.caseNumber}`);
        }
    });
    
    // فحص أرقام الدعاوى المكررة
    const caseNumbers = dataManager.casesData.map(c => c.caseNumber);
    const duplicateCaseNumbers = caseNumbers.filter((num, index) => caseNumbers.indexOf(num) !== index);
    if (duplicateCaseNumbers.length > 0) {
        issues.push(`أرقام دعاوى مكررة: ${duplicateCaseNumbers.join(', ')}`);
    }
    
    if (issues.length > 0) {
        const content = `
            <div style="max-height: 400px; overflow-y: auto;">
                <h4 style="color: var(--error-red); margin-bottom: 1rem;">تم العثور على ${issues.length} مشكلة في البيانات:</h4>
                <ul style="color: var(--gray-700); line-height: 1.8;">
                    ${issues.map(issue => `<li>${issue}</li>`).join('')}
                </ul>
                <div style="background: var(--warning-yellow-light); padding: 1rem; border-radius: 0.5rem; margin-top: 1rem;">
                    <strong style="color: var(--warning-yellow);">توصية:</strong>
                    <p style="margin: 0.5rem 0 0 0; color: var(--gray-700);">يُنصح بإصلاح هذه المشاكل لضمان سلامة البيانات وصحة التقارير.</p>
                </div>
            </div>
        `;
        
        const actions = `
            <button class="btn btn-secondary" onclick="closeModal(this)">إغلاق</button>
            <button class="btn btn-primary" onclick="closeModal(this); cleanupAndRepairData();">
                <i class="fas fa-wrench"></i>
                إصلاح تلقائي
            </button>
        `;
        
        createModal('فحص سلامة البيانات', content, actions);
    } else {
        showNotification('البيانات سليمة', 'جميع البيانات سليمة ولا توجد مشاكل', 'success');
    }
}

// تصدير البيانات للطباعة
function exportForPrint(data, title) {
    const printWindow = window.open('', '_blank');
    const printDoc = printWindow.document;
    
    printDoc.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <title>${title}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 2cm; direction: rtl; }
                h1 { color: #3b82f6; text-align: center; margin-bottom: 2rem; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                th { background-color: #f5f5f5; font-weight: bold; }
                .header { text-align: center; margin-bottom: 2rem; }
                .footer { text-align: center; margin-top: 2rem; font-size: 0.9em; color: #666; }
                @page { size: A4; margin: 2cm; }
                @media print { 
                    body { margin: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${title}</h1>
                <p>مجموعة السيد أسامة القانونية</p>
                <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</p>
            </div>
            
            ${data}
            
            <div class="footer">
                <p>تم إنشاء هذا التقرير بواسطة نظام إدارة الدعاوى القضائية</p>
            </div>
            
            <div class="no-print" style="text-align: center; margin-top: 2rem;">
                <button onclick="window.print()" style="padding: 1rem 2rem; font-size: 1rem;">طباعة</button>
                <button onclick="window.close()" style="padding: 1rem 2rem; font-size: 1rem; margin-right: 1rem;">إغلاق</button>
            </div>
        </body>
        </html>
    `);
    
    printDoc.close();
    printWindow.focus();
}

// ===================================================================
// 10. تفعيل النظام عند التحميل
// ===================================================================

// التحقق من وجود العناصر المطلوبة وتهيئة النظام
document.addEventListener('DOMContentLoaded', function() {
    console.log('تحميل النظام المحدث...');
    
    // التحقق من وجود dataManager الأصلي
    if (typeof DataManager === 'undefined') {
        console.error('DataManager غير موجود - يرجى التأكد من تحميل الملف الأساسي أولاً');
        return;
    }
    
    // إضافة أدوات إضافية للنظام
    if (!window.showAdvancedSearch) {
        window.showAdvancedSearch = showAdvancedSearch;
    }
    if (!window.generateComprehensiveReport) {
        window.generateComprehensiveReport = generateComprehensiveReport;
    }
    if (!window.showDetailedStatistics) {
        window.showDetailedStatistics = showDetailedStatistics;
    }
    if (!window.showBackupManager) {
        window.showBackupManager = showBackupManager;
    }
    if (!window.showUserGuide) {
        window.showUserGuide = showUserGuide;
    }
    if (!window.editCurrentCase) {
        window.editCurrentCase = editCurrentCase;
    }
    if (!window.validateDataIntegrity) {
        window.validateDataIntegrity = validateDataIntegrity;
    }
    
    // تحديث الدوال الموجودة
    const originalEditCase = window.editCase;
    window.editCase = function(id) {
        const caseData = dataManager.getCaseById(id);
        if (caseData) {
            dataManager.currentCase = caseData;
            editCurrentCase();
        } else if (originalEditCase) {
            originalEditCase(id);
        }
    };
    
    // تحديد موعد التهيئة
    setTimeout(() => {
        if (window.electronAPI) {
            // انتظار جاهزية Electron
            document.dispatchEvent(new CustomEvent('electronReady'));
        } else {
            // تهيئة فورية للمتصفح العادي
            initializeApplication();
        }
    }, 500);
    
    console.log('تم تحميل جميع الوظائف المحدثة بنجاح');
});

// إضافة قائمة بالوظائف المتاحة للمطور
window.LegalSystemAPI = {
    // إدارة البيانات
    dataManager: () => window.dataManager,
    saveData: () => window.dataManager.saveData(),
    loadData: () => window.dataManager.loadData(),
    
    // إدارة النوافذ
    minimizeWindow: window.minimizeWindow,
    toggleMaximize: window.toggleMaximize,
    closeWindow: window.closeWindow,
    
    // البحث والتقارير
    showAdvancedSearch: showAdvancedSearch,
    generateComprehensiveReport: generateComprehensiveReport,
    showDetailedStatistics: showDetailedStatistics,
    
    // النسخ الاحتياطية
    showBackupManager: showBackupManager,
    createManualBackup: createManualBackup,
    
    // أدوات مساعدة
    validateDataIntegrity: validateDataIntegrity,
    cleanupAndRepairData: cleanupAndRepairData,
    showUserGuide: showUserGuide,
    
    // معلومات النظام
    version: '1.1.0',
    buildDate: new Date().toISOString()
};

console.log('Legal Cases Management System - Enhanced Version 1.1.0 Loaded');
console.log('Available API:', window.LegalSystemAPI);