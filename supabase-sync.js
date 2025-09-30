// supabase-sync.js
(function() {
    'use strict';

    // Supabase Configuration
    const SUPABASE_URL = 'https://dopzopezvkwdoeeliwwd.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcHpvcGV6dmt3ZG9lZWxpd3dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMzg2MDQsImV4cCI6MjA3NDgxNDYwNH0.VZjhi0-tx5EvFwEXUfjCWyMujwbvGrGisSeOdYm0Rnk';

    // Load Supabase Client
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = initializeSupabase;
    document.head.appendChild(script);

    let supabase;
    let syncEnabled = true;
    let userId = null;

    function initializeSupabase() {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('✅ Supabase initialized successfully');
        
        // Get or create user session
        initializeUser();
        
        // Override DataManager methods
        enhanceDataManager();
        
        // Initial sync
        syncFromSupabase();
        
        // Setup periodic sync
        setInterval(syncFromSupabase, 30000); // Every 30 seconds
    }

    async function initializeUser() {
        // Get user ID from localStorage or create new one
        userId = localStorage.getItem('userId');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('userId', userId);
        }
        console.log('👤 User ID:', userId);
    }

    function enhanceDataManager() {
        if (!window.dataManager) {
            console.warn('⚠️ DataManager not found, waiting...');
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

        // Cases
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

        // Defendants
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

        // Lawyers
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

        // Deductions
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

        // Settings
        window.dataManager.updateSettings = async function(updates) {
            const updated = originalUpdateSettings(updates);
            if (syncEnabled) await syncSettingsToSupabase(updated);
            return updated;
        };

        console.log('✅ DataManager enhanced with Supabase sync');
    }

    // Sync functions
    async function syncCaseToSupabase(caseData, operation) {
        try {
            const data = { ...caseData, user_id: userId, synced_at: new Date().toISOString() };
            
            if (operation === 'insert') {
                const { error } = await supabase.from('cases').insert(data);
                if (error) throw error;
            } else if (operation === 'update') {
                const { error } = await supabase.from('cases').update(data).eq('id', caseData.id).eq('user_id', userId);
                if (error) throw error;
            } else if (operation === 'delete') {
                const { error } = await supabase.from('cases').delete().eq('id', caseData.id).eq('user_id', userId);
                if (error) throw error;
            }
            console.log('✅ Case synced:', operation);
        } catch (error) {
            console.error('❌ Error syncing case:', error);
        }
    }

    async function syncDefendantToSupabase(defendantData, operation) {
        try {
            const data = { ...defendantData, user_id: userId, synced_at: new Date().toISOString() };
            
            if (operation === 'insert') {
                const { error } = await supabase.from('defendants').insert(data);
                if (error) throw error;
            } else if (operation === 'update') {
                const { error } = await supabase.from('defendants').update(data).eq('id', defendantData.id).eq('user_id', userId);
                if (error) throw error;
            } else if (operation === 'delete') {
                const { error } = await supabase.from('defendants').delete().eq('id', defendantData.id).eq('user_id', userId);
                if (error) throw error;
            }
            console.log('✅ Defendant synced:', operation);
        } catch (error) {
            console.error('❌ Error syncing defendant:', error);
        }
    }

    async function syncLawyerToSupabase(lawyerData, operation) {
        try {
            const data = { ...lawyerData, user_id: userId, synced_at: new Date().toISOString() };
            
            if (operation === 'insert') {
                const { error } = await supabase.from('lawyers').insert(data);
                if (error) throw error;
            } else if (operation === 'update') {
                const { error } = await supabase.from('lawyers').update(data).eq('id', lawyerData.id).eq('user_id', userId);
                if (error) throw error;
            } else if (operation === 'delete') {
                const { error } = await supabase.from('lawyers').delete().eq('id', lawyerData.id).eq('user_id', userId);
                if (error) throw error;
            }
            console.log('✅ Lawyer synced:', operation);
        } catch (error) {
            console.error('❌ Error syncing lawyer:', error);
        }
    }

    async function syncDeductionToSupabase(deductionData, operation) {
        try {
            const data = { ...deductionData, user_id: userId, synced_at: new Date().toISOString() };
            
            if (operation === 'insert') {
                const { error } = await supabase.from('deductions').insert(data);
                if (error) throw error;
            } else if (operation === 'update') {
                const { error } = await supabase.from('deductions').update(data).eq('id', deductionData.id).eq('user_id', userId);
                if (error) throw error;
            } else if (operation === 'delete') {
                const { error } = await supabase.from('deductions').delete().eq('id', deductionData.id).eq('user_id', userId);
                if (error) throw error;
            }
            console.log('✅ Deduction synced:', operation);
        } catch (error) {
            console.error('❌ Error syncing deduction:', error);
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
            console.log('✅ Settings synced');
        } catch (error) {
            console.error('❌ Error syncing settings:', error);
        }
    }

    async function syncFromSupabase() {
        if (!supabase || !userId) return;
        
        try {
            // Get last sync time
            const lastSync = localStorage.getItem('lastSupabaseSync') || new Date(0).toISOString();
            
            // Fetch updated data
            const { data: cases } = await supabase.from('cases').select('*').eq('user_id', userId).gte('synced_at', lastSync);
            const { data: defendants } = await supabase.from('defendants').select('*').eq('user_id', userId).gte('synced_at', lastSync);
            const { data: lawyers } = await supabase.from('lawyers').select('*').eq('user_id', userId).gte('synced_at', lastSync);
            const { data: deductions } = await supabase.from('deductions').select('*').eq('user_id', userId).gte('synced_at', lastSync);
            const { data: settings } = await supabase.from('settings').select('*').eq('user_id', userId).single();
            
            // Update local data
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
            
            // Update last sync time
            localStorage.setItem('lastSupabaseSync', new Date().toISOString());
            
            // Save to localStorage
            window.dataManager.saveData();
            
            console.log('✅ Synced from Supabase');
        } catch (error) {
            console.error('❌ Error syncing from Supabase:', error);
        }
    }

    // Expose sync control
    window.supabaseSync = {
        enable: () => { syncEnabled = true; console.log('✅ Sync enabled'); },
        disable: () => { syncEnabled = false; console.log('⏸️ Sync disabled'); },
        forceSync: syncFromSupabase,
        status: () => ({ enabled: syncEnabled, userId, connected: !!supabase })
    };

})();
