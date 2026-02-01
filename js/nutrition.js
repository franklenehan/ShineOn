(function(){
  'use strict';

  let tips = [];
  let recipes = [];
  let editTipId = null;
  let editRecipeId = null;

  async function loadAll(){
    try {
      // Load tips and recipes from backend (MySQL) via StorageAPI wrappers
      tips = (await StorageAPI.listNutritionTips()) || [];
    } catch (e) {
      console.error('Error loading nutrition tips from server:', e);
      tips = [];
    }

    try {
      // Load all recipes; per-category filtering is handled in renderRecipes
      recipes = (await StorageAPI.listNutritionRecipes()) || [];
    } catch (e) {
      console.error('Error loading nutrition recipes from server:', e);
      recipes = [];
    }

    renderTips();
    renderRecipes();
  }

  function uid(){ return Date.now() + Math.floor(Math.random()*1000); }

  function renderTips(){
    const list = document.getElementById('tips-list');
    const empty = document.getElementById('tips-empty');
    if(!list || !empty) return;
    list.innerHTML = '';
    if(!tips.length){ empty.style.display = 'block'; return; }
    empty.style.display = 'none';
    const frag = document.createDocumentFragment();
    tips.slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).forEach(t => {
      const col = document.createElement('div');
      col.className = 'col-md-6';
      col.innerHTML = `
        <div class="card h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <h6 class="mb-0">${escapeHtml(t.title)}</h6>
              <span class="badge bg-light text-dark">${escapeHtml(t.category||'General')}</span>
            </div>
            ${t.details ? `<p class="mb-0 small text-muted">${escapeHtml(t.details).replace(/\n/g,'<br>')}</p>` : ''}
          </div>
          <div class="card-footer bg-light d-flex justify-content-end gap-2">
            <button class="btn btn-sm btn-outline-primary" data-action="edit" data-id="${t.id}"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${t.id}"><i class="bi bi-trash"></i></button>
          </div>
        </div>`;
      frag.appendChild(col);
    });
    list.appendChild(frag);
    list.querySelectorAll('button[data-action]')
      .forEach(btn => btn.addEventListener('click', tipActionHandler));
  }

  function tipActionHandler(e){
    const id = parseInt(e.currentTarget.getAttribute('data-id'));
    const action = e.currentTarget.getAttribute('data-action');
    const t = tips.find(x=>x.id===id);
    if(!t) return;
    if(action==='edit'){
      editTipId = id;
      document.getElementById('tip-title').value = t.title || '';
      document.getElementById('tip-category').value = t.category || 'General';
      document.getElementById('tip-details').value = t.details || '';
      document.getElementById('tipModalTitle').textContent = 'Edit Tip';
      const modal = new bootstrap.Modal(document.getElementById('addTipModal'));
      modal.show();
    } else if(action==='delete'){
      if(confirm('Delete this tip?')){
        tips = tips.filter(x=>x.id!==id);
        saveTips();
        renderTips();
      }
    }
  }

  async function saveTips(){
    // Persist the current tip (add or update) to the backend.
    // For simplicity, just reload from server after save; callers
    // are responsible for calling loadAll() again.
    if (!tips || tips.length === 0) return;
  }

  function renderRecipes(){
    const categories = ['Breakfast','Lunch','Dinner','Snacks'];
    let total = 0;
    categories.forEach(cat => {
      const listEl = document.getElementById('list-'+cat.toLowerCase());
      const emptyEl = document.getElementById('empty-'+cat.toLowerCase());
      if(!listEl||!emptyEl) return;
      const list = recipes.filter(r=>r.category===cat);
      total += list.length;
      listEl.innerHTML = '';
      if(!list.length){ emptyEl.style.display='block'; return; }
      emptyEl.style.display='none';
      const frag = document.createDocumentFragment();
      list.slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).forEach(r => {
        const col = document.createElement('div');
        col.className = 'col-md-6';
        const ingredients = (r.ingredients||[]).map(i=>`<li>${escapeHtml(i)}</li>`).join('');
        col.innerHTML = `
          <div class="card h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <h6 class="mb-0">${escapeHtml(r.title)}</h6>
                <span class="badge bg-light text-dark">${escapeHtml(r.category)}</span>
              </div>
              ${ingredients ? `<div class="mb-2"><strong class="small">Ingredients</strong><ul class="small mb-0">${ingredients}</ul></div>` : ''}
              ${r.instructions ? `<div class="small text-muted">${escapeHtml(r.instructions).replace(/\n/g,'<br>')}</div>` : ''}
            </div>
            <div class="card-footer bg-light d-flex justify-content-end gap-2">
              <button class="btn btn-sm btn-outline-primary" data-r-action="edit" data-id="${r.id}"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-sm btn-outline-danger" data-r-action="delete" data-id="${r.id}"><i class="bi bi-trash"></i></button>
            </div>
          </div>`;
        frag.appendChild(col);
      });
      listEl.appendChild(frag);
      listEl.querySelectorAll('button[data-r-action]')
        .forEach(btn => btn.addEventListener('click', recipeActionHandler));
    });
    const countEl = document.getElementById('recipes-count');
    if(countEl) countEl.textContent = String(total);
  }

  function recipeActionHandler(e){
    const id = parseInt(e.currentTarget.getAttribute('data-id'));
    const action = e.currentTarget.getAttribute('data-r-action');
    const r = recipes.find(x=>x.id===id);
    if(!r) return;
    if(action==='edit'){
      editRecipeId = id;
      document.getElementById('recipe-title').value = r.title || '';
      document.getElementById('recipe-category').value = r.category || '';
      document.getElementById('recipe-ingredients').value = (r.ingredients||[]).join('\n');
      document.getElementById('recipe-instructions').value = r.instructions || '';
      document.getElementById('recipeModalTitle').textContent = 'Edit Recipe';
      const modal = new bootstrap.Modal(document.getElementById('addRecipeModal'));
      modal.show();
    } else if(action==='delete'){
      if(confirm('Delete this recipe?')){
        recipes = recipes.filter(x=>x.id!==id);
        saveRecipes();
        renderRecipes();
      }
    }
  }

  async function saveRecipes(){
    // Recipes are now stored per-item via saveNutritionRecipe, so
    // this helper remains only for backward compatibility.
    if (!recipes || recipes.length === 0) return;
  }

  function exportRecipesCsv(){
    if(!recipes.length){
      if(typeof showAlert==='function') showAlert('No recipes to export', 'warning');
      return;
    }
    const headers = ['Title','Category','Ingredients','Instructions','Created At'];
    const rows = recipes.map(r => [
      r.title||'',
      r.category||'',
      (r.ingredients||[]).join(' | ').replace(/"/g,'""'),
      (r.instructions||'').replace(/"/g,'""').replace(/\n/g,' '),
      r.createdAt||''
    ]);
    const csv = [headers.join(','), ...rows.map(row => row.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recipes-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function escapeHtml(text){
    const div = document.createElement('div');
    div.textContent = text==null? '' : String(text);
    return div.innerHTML;
  }

  document.addEventListener('DOMContentLoaded', function(){
    const tipSaveBtn = document.getElementById('save-tip-btn');
    if(tipSaveBtn){
      tipSaveBtn.addEventListener('click', async function(){
        const form = document.getElementById('tip-form');
        if(!form.checkValidity()){ form.classList.add('was-validated'); return; }

        const title = document.getElementById('tip-title').value.trim();
        const category = document.getElementById('tip-category').value;
        const details = document.getElementById('tip-details').value;

        try {
          // Persist to backend via StorageAPI
          const payload = {
            title,
            category,
            details
          };
          if (editTipId) {
            payload.id = editTipId;
          }

          const newId = await StorageAPI.saveNutritionTip(payload);

          // Keep local array in sync by reloading from server
          await loadAll();

          editTipId = null;
          document.getElementById('tipModalTitle').textContent = 'Add Tip';
          form.reset();
          const m = bootstrap.Modal.getInstance(document.getElementById('addTipModal'));
          m && m.hide();
          if(typeof showAlert==='function') showAlert('Tip saved', 'success');
        } catch (e) {
          console.error('Error saving nutrition tip:', e);
          if(typeof showAlert==='function') showAlert('Error saving tip', 'danger');
        }
      });
    }

    const recipeSaveBtn = document.getElementById('save-recipe-btn');
    if(recipeSaveBtn){
      recipeSaveBtn.addEventListener('click', async function(){
        const form = document.getElementById('recipe-form');
        if(!form.checkValidity()){ form.classList.add('was-validated'); return; }

        const title = document.getElementById('recipe-title').value.trim();
        const category = document.getElementById('recipe-category').value;
        const ingredients = document.getElementById('recipe-ingredients').value.split('\n').map(s=>s.trim()).filter(Boolean);
        const instructions = document.getElementById('recipe-instructions').value;

        try {
          const payload = {
            title,
            category,
            ingredients,
            instructions
          };
          if (editRecipeId) {
            payload.id = editRecipeId;
          }

          const newId = await StorageAPI.saveNutritionRecipe(payload);

          // Reload from backend so UI reflects DB state
          await loadAll();

          editRecipeId = null;
          document.getElementById('recipeModalTitle').textContent = 'Add Recipe';
          form.reset();
          const m = bootstrap.Modal.getInstance(document.getElementById('addRecipeModal'));
          m && m.hide();
          if(typeof showAlert==='function') showAlert('Recipe saved', 'success');
        } catch (e) {
          console.error('Error saving nutrition recipe:', e);
          if(typeof showAlert==='function') showAlert('Error saving recipe', 'danger');
        }
      });
    }

    const exportBtn = document.getElementById('export-recipes-btn');
    if(exportBtn){ exportBtn.addEventListener('click', exportRecipesCsv); }

    const tipModal = document.getElementById('addTipModal');
    if(tipModal){ tipModal.addEventListener('hidden.bs.modal', function(){
      editTipId = null; const form = document.getElementById('tip-form'); if(form){ form.reset(); form.classList.remove('was-validated'); }
      document.getElementById('tipModalTitle').textContent = 'Add Tip';
    }); }

    const recipeModal = document.getElementById('addRecipeModal');
    if(recipeModal){ recipeModal.addEventListener('hidden.bs.modal', function(){
      editRecipeId = null; const form = document.getElementById('recipe-form'); if(form){ form.reset(); form.classList.remove('was-validated'); }
      document.getElementById('recipeModalTitle').textContent = 'Add Recipe';
    }); }

    loadAll();
  });
})();
