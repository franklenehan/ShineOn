(function(){
  'use strict';

  let tips = [];
  let recipes = [];
  let editTipId = null;
  let editRecipeId = null;
  let viewTipId = null;

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
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
      item.setAttribute('data-id', t.id);
      item.innerHTML = `
        <div class="me-3 text-start">
          <div class="fw-semibold">${escapeHtml(t.title)}</div>
        </div>
        <span class="badge bg-light text-dark ms-auto">${escapeHtml(t.category||'General')}</span>`;
      frag.appendChild(item);
    });
    list.appendChild(frag);

    list.querySelectorAll('.list-group-item-action')
      .forEach(btn => btn.addEventListener('click', onTipListItemClick));
  }

  function onTipListItemClick(e){
    const id = e.currentTarget.getAttribute('data-id');
    if(id == null) return;
    openTipView(id);
  }

  function openTipView(id){
    const t = tips.find(x=>String(x.id)===String(id));
    if(!t) return;
    viewTipId = t.id;
    const titleEl = document.getElementById('view-tip-title');
    const catEl = document.getElementById('view-tip-category');
    const detailsEl = document.getElementById('view-tip-details');
    if(titleEl) titleEl.textContent = t.title || '';
    if(catEl) catEl.textContent = t.category || 'General';
    if(detailsEl) detailsEl.innerHTML = t.details ? escapeHtml(t.details).replace(/\n/g,'<br>') : '<span class="text-muted">No details provided.</span>';

    const modalEl = document.getElementById('viewTipModal');
    if(modalEl){
      const m = bootstrap.Modal.getOrCreateInstance(modalEl);
      m.show();
    }
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
      const key = cat.toLowerCase();
      const accEl = document.getElementById('accordion-'+key);
      const emptyEl = document.getElementById('empty-'+key);
      if (!accEl || !emptyEl) return;

      const list = recipes.filter(r => r.category === cat);
      total += list.length;

      accEl.innerHTML = '';
      if (!list.length) {
        emptyEl.style.display = 'block';
        return;
      }
      emptyEl.style.display = 'none';

      const frag = document.createDocumentFragment();

      list
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .forEach((r, index) => {
          // Normalise ingredients to an array
          let ingredientsArr;
          if (Array.isArray(r.ingredients)) {
            ingredientsArr = r.ingredients;
          } else if (typeof r.ingredients === 'string') {
            const raw = r.ingredients.trim();
            // Handle JSON-stringified arrays like ["Eggs","Bread"]
            if (raw.startsWith('[') && raw.endsWith(']')) {
              try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                  ingredientsArr = parsed;
                } else {
                  ingredientsArr = raw.split('\n').map(s => s.trim()).filter(Boolean);
                }
              } catch (e) {
                ingredientsArr = raw.split('\n').map(s => s.trim()).filter(Boolean);
              }
            } else {
              ingredientsArr = raw.split('\n').map(s => s.trim()).filter(Boolean);
            }
          } else {
            ingredientsArr = [];
          }

          const ingredients = ingredientsArr
            .map(i => `
              <li class="form-check small mb-1">
                <input class="form-check-input me-2" type="checkbox" value="">
                <label class="form-check-label">
                  ${escapeHtml(i)}
                </label>
              </li>`)
            .join('');

          const itemId = `acc-${key}-${r.id || index}`;
          const headingId = `${itemId}-heading`;
          const collapseId = `${itemId}-body`;

          const wrapper = document.createElement('div');
          wrapper.className = 'accordion-item';
          wrapper.innerHTML = `
            <h2 class="accordion-header" id="${headingId}">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}">
                ${escapeHtml(r.title)}
              </button>
            </h2>
            <div id="${collapseId}" class="accordion-collapse collapse" aria-labelledby="${headingId}" data-bs-parent="#accordion-${key}">
              <div class="accordion-body">
                ${ingredients ? `
                  <div class="mb-3">
                    <strong class="small d-block mb-1">Ingredients</strong>
                    <ul class="list-unstyled mb-0">
                      ${ingredients}
                    </ul>
                  </div>` : ''}
                ${r.instructions ? `
                  <div class="mb-3">
                    <strong class="small d-block mb-1">Instructions</strong>
                    <div class="small text-muted mb-0">${escapeHtml(r.instructions).replace(/\n/g,'<br>')}</div>
                  </div>` : ''}
                <div class="d-flex justify-content-end gap-2 mt-2">
                  <button class="btn btn-sm btn-outline-primary recipe-edit-btn" data-r-action="edit" data-id="${r.id}"><i class="bi bi-pencil"></i></button>
                  <button class="btn btn-sm btn-outline-danger" data-r-action="delete" data-id="${r.id}"><i class="bi bi-trash"></i></button>
                </div>
              </div>
            </div>
          `;
          frag.appendChild(wrapper);
        });

      accEl.appendChild(frag);

      accEl.querySelectorAll('button[data-r-action]')
        .forEach(btn => btn.addEventListener('click', recipeActionHandler));
    });

    const countEl = document.getElementById('recipes-count');
    if (countEl) countEl.textContent = String(total);
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
      // Normalise ingredients to an array for editing
      let ingArr;
      if (Array.isArray(r.ingredients)) {
        ingArr = r.ingredients;
      } else if (typeof r.ingredients === 'string') {
        const raw = r.ingredients.trim();
        if (raw.startsWith('[') && raw.endsWith(']')) {
          try {
            const parsed = JSON.parse(raw);
            ingArr = Array.isArray(parsed) ? parsed : [raw];
          } catch (e) {
            ingArr = raw.split('\n').map(s => s.trim()).filter(Boolean);
          }
        } else {
          ingArr = raw.split('\n').map(s => s.trim()).filter(Boolean);
        }
      } else {
        ingArr = [];
      }

      document.getElementById('recipe-ingredients').value = ingArr.join('\n');
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

    const viewTipEditBtn = document.getElementById('view-tip-edit-btn');
    if(viewTipEditBtn){
      viewTipEditBtn.addEventListener('click', function(){
        if(!viewTipId) return;
        const t = tips.find(x=>x.id===viewTipId);
        if(!t) return;
        editTipId = viewTipId;
        document.getElementById('tip-title').value = t.title || '';
        document.getElementById('tip-category').value = t.category || 'General';
        document.getElementById('tip-details').value = t.details || '';
        document.getElementById('tipModalTitle').textContent = 'Edit Tip';

        const viewModalEl = document.getElementById('viewTipModal');
        const viewModal = bootstrap.Modal.getInstance(viewModalEl);
        viewModal && viewModal.hide();

        const editModal = new bootstrap.Modal(document.getElementById('addTipModal'));
        editModal.show();
      });
    }

    const viewTipDeleteBtn = document.getElementById('view-tip-delete-btn');
    if(viewTipDeleteBtn){
      viewTipDeleteBtn.addEventListener('click', async function(){
        if(!viewTipId) return;
        const id = viewTipId;
        const t = tips.find(x=>x.id===id);
        if(!t) return;
        if(!confirm('Delete this tip?')) return;

        try {
          // Permanently delete from backend (MySQL)
          await StorageAPI.deleteNutritionTip(id);

          // Reload tips from server so UI matches DB state
          await loadAll();

          const viewModalEl = document.getElementById('viewTipModal');
          const viewModal = bootstrap.Modal.getInstance(viewModalEl);
          viewModal && viewModal.hide();
          viewTipId = null;
          if(typeof showAlert==='function') showAlert('Tip deleted', 'success');
        } catch (e) {
          console.error('Error deleting nutrition tip:', e);
          if(typeof showAlert==='function') showAlert('Error deleting tip', 'danger');
        }
      });
    }

    const viewTipModalEl = document.getElementById('viewTipModal');
    if(viewTipModalEl){
      viewTipModalEl.addEventListener('hidden.bs.modal', function(){
        viewTipId = null;
      });
    }

    function navigateTip(step){
      if(!tips || tips.length === 0) return;
      // Sort tips in the same order as renderTips
      const ordered = tips.slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
      let idx = ordered.findIndex(t => String(t.id) === String(viewTipId));
      if(idx === -1){
        idx = 0;
      } else {
        idx = (idx + step + ordered.length) % ordered.length;
      }
      const nextTip = ordered[idx];
      if(nextTip){
        openTipView(nextTip.id);
      }
    }

    const prevBtn = document.getElementById('view-tip-prev-btn');
    if(prevBtn){
      prevBtn.addEventListener('click', function(e){
        e.preventDefault();
        e.stopPropagation();
        navigateTip(-1);
      });
    }

    const nextBtn = document.getElementById('view-tip-next-btn');
    if(nextBtn){
      nextBtn.addEventListener('click', function(e){
        e.preventDefault();
        e.stopPropagation();
        navigateTip(1);
      });
    }

    loadAll();
  });
})();
