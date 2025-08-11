/* ===========================================
   Логер Идей — app.js
   Исходная версия: вынесено из index.html
   Автор: Артём
   Дата выгрузки: 2025-08-11
   Описание: основной JavaScript-файл веб-приложения.
   =========================================== */

// Класс управления состоянием приложения
        class AppState {
            constructor() {
                this.ideas = [];
                this.categories = [];
                this.currentView = 'all';
                this.currentCategory = null;
                this.currentTag = null;
                this.currentIdeaId = null;
                this.currentCategoryId = null;
                this.tags = [];
                this.selectedColor = '#f59e0b';
                this.currentImageData = null;
                this.filterByImage = false;
                this.sidebarOpen = false;
                this.sortBy = 'newest';
                this.theme = 'light';
            }
            
            // Загрузка данных из localStorage
            loadFromStorage() {
                try {
                    const storedIdeas = localStorage.getItem('ideas');
                    if (storedIdeas) {
                        this.ideas = JSON.parse(storedIdeas);
                    }
                    const storedCategories = localStorage.getItem('categories');
                    if (storedCategories) {
                        this.categories = JSON.parse(storedCategories);
                    } else {
                        this.categories = this.getDefaultCategories();
                    }
                    
                    // Загрузка темы
                    const storedTheme = localStorage.getItem('theme');
                    if (storedTheme) {
                        this.theme = storedTheme;
                        document.documentElement.setAttribute('data-theme', this.theme);
                    }
                    
                    // Загрузка сортировки
                    const storedSortBy = localStorage.getItem('sortBy');
                    if (storedSortBy) {
                        this.sortBy = storedSortBy;
                        document.getElementById('sort-select').value = storedSortBy;
                    }
                    
                    // Добавляем lightColor к существующим категориям, если его нет
                    this.categories = this.categories.map(category => {
                        if (!category.lightColor) {
                            const defaultCategory = this.getDefaultCategories().find(c => c.id === category.id);
                            if (defaultCategory) {
                                return {
                                    ...category,
                                    lightColor: defaultCategory.lightColor
                                };
                            } else {
                                return {
                                    ...category,
                                    lightColor: this.getLightColor(category.color)
                                };
                            }
                        }
                        return category;
                    });
                } catch (e) {
                    console.error('Error loading data from storage:', e);
                    this.ideas = [];
                    this.categories = this.getDefaultCategories();
                }
            }
            
            // Сохранение данных в localStorage
            saveToStorage() {
                try {
                    localStorage.setItem('ideas', JSON.stringify(this.ideas));
                    localStorage.setItem('categories', JSON.stringify(this.categories));
                    localStorage.setItem('theme', this.theme);
                    localStorage.setItem('sortBy', this.sortBy);
                } catch (e) {
                    console.error('Error saving data to storage:', e);
                }
            }
            
            // Переключение темы
            toggleTheme() {
                this.theme = this.theme === 'light' ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', this.theme);
                this.saveToStorage();
            }
            
            // Получение категорий по умолчанию
            getDefaultCategories() {
                return [
                    { id: 'personal', name: 'Личное', color: '#f59e0b', lightColor: '#fef9e7' },
                    { id: 'work', name: 'Работа', color: '#3b82f6', lightColor: '#eff6ff' },
                    { id: 'project', name: 'Проект', color: '#8b5cf6', lightColor: '#f3f0ff' },
                    { id: 'inspiration', name: 'Вдохновение', color: '#ec4899', lightColor: '#fdf2f8' }
                ];
            }
            
            // Получение светлого цвета из HEX
            getLightColor(hexColor) {
                const r = parseInt(hexColor.slice(1, 3), 16);
                const g = parseInt(hexColor.slice(3, 5), 16);
                const b = parseInt(hexColor.slice(5, 7), 16);
                
                const lightR = Math.round(r * 0.15 + 255 * 0.85);
                const lightG = Math.round(g * 0.15 + 255 * 0.85);
                const lightB = Math.round(b * 0.15 + 255 * 0.85);
                
                return '#' + 
                    lightR.toString(16).padStart(2, '0') + 
                    lightG.toString(16).padStart(2, '0') + 
                    lightB.toString(16).padStart(2, '0');
            }
            
            // Фильтрация идей
            getFilteredIdeas(searchTerm = '') {
                return this.ideas.filter(idea => {
                    // Фильтр по виду (все или архив)
                    if (this.currentView === 'archived' && !idea.archived) return false;
                    if (this.currentView !== 'archived' && idea.archived) return false;
                    
                    // Фильтр по категории
                    if (this.currentCategory === null) {
                        // Не выбрана категория - показываем все идеи текущего вида
                    } else if (this.currentCategory === 'none') {
                        // Выбрана категория "Без категории" - показываем только идеи без категории
                        if (idea.category !== null) return false;
                    } else {
                        // Выбрана конкретная категория
                        if (idea.category !== this.currentCategory) return false;
                    }
                    
                    // Фильтр по тегу
                    if (this.currentTag && (!idea.tags || !idea.tags.includes(this.currentTag))) return false;
                    
                    // Фильтр по изображению
                    if (this.filterByImage && !idea.image) return false;
                    
                    // Фильтр по поисковому запросу
                    if (searchTerm) {
                        const lowerSearch = searchTerm.toLowerCase();
                        const titleMatch = idea.title.toLowerCase().includes(lowerSearch);
                        const contentMatch = idea.content.toLowerCase().includes(lowerSearch);
                        const tagsMatch = idea.tags && idea.tags.some(tag => tag.toLowerCase().includes(lowerSearch));
                        
                        if (!titleMatch && !contentMatch && !tagsMatch) return false;
                    }
                    
                    return true;
                }).sort((a, b) => {
                    // Сортировка в зависимости от выбранного типа
                    switch (this.sortBy) {
                        case 'newest':
                            return new Date(b.createdAt) - new Date(a.createdAt);
                        case 'oldest':
                            return new Date(a.createdAt) - new Date(b.createdAt);
                        case 'name':
                            return a.title.localeCompare(b.title);
                        case 'category':
                            const categoryA = this.getCategoryById(a.category) || { name: 'Без категории' };
                            const categoryB = this.getCategoryById(b.category) || { name: 'Без категории' };
                            return categoryA.name.localeCompare(categoryB.name);
                        default:
                            return new Date(b.createdAt) - new Date(a.createdAt);
                    }
                });
            }
            
            // Получение категории по ID
            getCategoryById(id) {
                if (id === 'none') {
                    return { id: 'none', name: 'Без категории', color: '#d1d5db', lightColor: '#f9fafb' };
                }
                return this.categories.find(category => category.id === id);
            }
            
            // Подсчет активных идей
            getActiveIdeasCount() {
                return this.ideas.filter(idea => !idea.archived).length;
            }
            
            // Подсчет архивных идей
            getArchivedIdeasCount() {
                return this.ideas.filter(idea => idea.archived).length;
            }
        }
        
        // Класс управления идеями
        class IdeaManager {
            constructor(appState) {
                this.appState = appState;
            }
            
            // Добавление новой идеи
            addIdea(idea) {
                const newIdea = {
                    id: Date.now().toString(),
                    title: idea.title,
                    content: idea.content,
                    category: idea.category || null,
                    tags: idea.tags || [],
                    image: idea.image || null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    archived: false,
                    pinned: false
                };
                
                this.appState.ideas.push(newIdea);
                this.appState.saveToStorage();
                return newIdea;
            }
            
            // Обновление идеи
            updateIdea(id, updates) {
                const index = this.appState.ideas.findIndex(idea => idea.id === id);
                if (index !== -1) {
                    this.appState.ideas[index] = {
                        ...this.appState.ideas[index],
                        ...updates,
                        updatedAt: new Date().toISOString()
                    };
                    this.appState.saveToStorage();
                    return this.appState.ideas[index];
                }
                return null;
            }
            
            // Удаление идеи
            deleteIdea(id) {
                this.appState.ideas = this.appState.ideas.filter(idea => idea.id !== id);
                this.appState.saveToStorage();
            }
            
            // Переключение архивации идеи
            toggleArchive(id) {
                const idea = this.appState.ideas.find(idea => idea.id === id);
                if (idea) {
                    idea.archived = !idea.archived;
                    idea.updatedAt = new Date().toISOString();
                    this.appState.saveToStorage();
                    return idea;
                }
                return null;
            }
            
            // Переключение закрепления идеи
            togglePin(id) {
                const idea = this.appState.ideas.find(idea => idea.id === id);
                if (idea) {
                    idea.pinned = !idea.pinned;
                    idea.updatedAt = new Date().toISOString();
                    this.appState.saveToStorage();
                    return idea;
                }
                return null;
            }
            
            // Очистка архива
            clearArchive() {
                this.appState.ideas = this.appState.ideas.filter(idea => !idea.archived);
                this.appState.saveToStorage();
            }
        }
        
        // Класс управления категориями
        class CategoryManager {
            constructor(appState) {
                this.appState = appState;
            }
            
            // Добавление новой категории
            addCategory(category) {
                const newCategory = {
                    id: Date.now().toString(),
                    name: category.name,
                    color: category.color,
                    lightColor: this.appState.getLightColor(category.color)
                };
                
                this.appState.categories.push(newCategory);
                this.appState.saveToStorage();
                return newCategory;
            }
            
            // Обновление категории
            updateCategory(id, updates) {
                const index = this.appState.categories.findIndex(category => category.id === id);
                if (index !== -1) {
                    this.appState.categories[index] = {
                        ...this.appState.categories[index],
                        ...updates,
                        lightColor: this.appState.getLightColor(updates.color || this.appState.categories[index].color)
                    };
                    this.appState.saveToStorage();
                    return this.appState.categories[index];
                }
                return null;
            }
            
            // Удаление категории
            deleteCategory(id) {
                // Переносим идеи из удаляемой категории в "Без категории"
                this.appState.ideas = this.appState.ideas.map(idea => {
                    if (idea.category === id) {
                        return {
                            ...idea,
                            category: null,
                            updatedAt: new Date().toISOString()
                        };
                    }
                    return idea;
                });
                
                this.appState.categories = this.appState.categories.filter(category => category.id !== id);
                this.appState.saveToStorage();
            }
            
            // Получение категории по ID
            getCategoryById(id) {
                if (id === 'none') {
                    return { id: 'none', name: 'Без категории', color: '#d1d5db', lightColor: '#f9fafb' };
                }
                return this.appState.categories.find(category => category.id === id);
            }
            
            // Подсчет идей в категории
            countIdeasInCategory(categoryId) {
                if (categoryId === 'none') {
                    return this.appState.ideas.filter(idea => 
                        idea.category === null && 
                        (this.appState.currentView === 'archived' ? idea.archived : !idea.archived)
                    ).length;
                }
                return this.appState.ideas.filter(idea => 
                    idea.category === categoryId && 
                    (this.appState.currentView === 'archived' ? idea.archived : !idea.archived)
                ).length;
            }
        }
        
        // Класс управления пользовательским интерфейсом
        class UIManager {
            constructor(appState, ideaManager, categoryManager) {
                this.appState = appState;
                this.ideaManager = ideaManager;
                this.categoryManager = categoryManager;
                
                // DOM элементы
                this.ideasList = document.getElementById('ideas-list');
                this.emptyState = document.getElementById('empty-state');
                this.ideaModal = document.getElementById('idea-modal');
                this.categoryModal = document.getElementById('category-modal');
                this.searchInput = document.getElementById('search-input');
                this.searchClear = document.getElementById('search-clear');
                this.searchContainer = document.getElementById('search-container');
                this.filterContainer = document.getElementById('filter-container');
                this.imageFilterContainer = document.getElementById('image-filter-container');
                this.filterTagText = document.getElementById('filter-tag-text');
                this.categoriesList = document.getElementById('categories-list');
                this.toast = document.getElementById('toast');
                this.toastMessage = document.getElementById('toast-message');
                this.sidebar = document.getElementById('sidebar');
                this.sidebarOverlay = document.getElementById('sidebar-overlay');
                this.menuToggle = document.getElementById('menu-toggle');
                this.currentCategoryElement = document.getElementById('current-category');
                this.fab = document.getElementById('fab');
                this.imageViewer = document.getElementById('image-viewer');
                this.viewerImage = document.getElementById('viewer-image');
                this.activeCount = document.getElementById('active-count');
                this.archivedCount = document.getElementById('archived-count');
                this.themeToggle = document.getElementById('theme-toggle');
                this.sortSelect = document.getElementById('sort-select');
                this.quickAdd = document.getElementById('quick-add');
                this.quickAddInput = document.getElementById('quick-add-input');
                this.quickAddCancel = document.getElementById('quick-add-cancel');
                this.quickAddSave = document.getElementById('quick-add-save');
                this.cameraBtn = document.getElementById('camera-btn');
                this.galleryBtn = document.getElementById('gallery-btn');
                this.ideaImage = document.getElementById('idea-image');
                this.ideaCamera = document.getElementById('idea-camera');
                this.imagePreview = document.getElementById('image-preview');
                
                // Флаги для управления состоянием FAB
                this.isDragging = false;
                this.dragStartX = 0;
                this.dragStartY = 0;
                this.fabStartX = 0;
                this.fabStartY = 0;
                this.longPressTimer = null;
                this.isLongPress = false;
                this.ignoreNextClick = false;
                this.isFabClickProcessing = false;
                this.lastFabClickTime = 0;
                this.hasMoved = false; // Флаг для отслеживания перемещения FAB
            }
            
            // Инициализация UI
            init() {
                this.setupEventListeners();
                this.renderCategories();
                this.renderIdeas();
                this.updateCategoryCounts();
                this.updateActiveArchivedCounts();
                this.updateCategorySelect();
                this.updateCurrentCategoryTitle();
                this.updateSearchInterface();
                this.setupFabDragging();
                this.setupOrientationChange();
                this.updateThemeIcon();
            }
            
            // Настройка обработчиков событий
            setupEventListeners() {
                // Переключение бокового меню
                this.menuToggle.addEventListener('click', () => {
                    this.toggleSidebar();
                });
                
                // Закрытие бокового меню при клике на оверлей
                this.sidebarOverlay.addEventListener('click', () => {
                    this.closeSidebar();
                });
                
                // Переключение темы
                this.themeToggle.addEventListener('click', () => {
                    this.appState.toggleTheme();
                    this.updateThemeIcon();
                });
                
                // Изменение сортировки
                this.sortSelect.addEventListener('change', () => {
                    this.appState.sortBy = this.sortSelect.value;
                    this.appState.saveToStorage();
                    this.renderIdeas();
                });
                
                // Обработчики для FAB с защитой от случайных нажатий
                this.fab.addEventListener('click', (e) => {
                    this.handleFabClick(e);
                });
                
                this.fab.addEventListener('touchend', (e) => {
                    this.handleFabClick(e);
                });
                
                // Кнопки модального окна идеи
                document.getElementById('close-modal-btn').addEventListener('click', () => {
                    this.closeIdeaModal();
                });
                document.getElementById('cancel-btn').addEventListener('click', () => {
                    this.closeIdeaModal();
                });
                document.getElementById('save-idea-btn').addEventListener('click', () => {
                    this.saveIdea();
                });
                
                // Навигация в боковой панели
                document.querySelectorAll('.sidebar-item').forEach(item => {
                    item.addEventListener('click', () => {
                        // Если клик на активный элемент, сбрасываем фильтр по категории
                        if (item.classList.contains('active')) {
                            this.appState.currentCategory = null;
                            document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
                        } else {
                            document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
                            item.classList.add('active');
                            this.appState.currentView = item.dataset.view;
                        }
                        
                        this.clearTagFilter();
                        this.clearImageFilter();
                        this.updateCurrentCategoryTitle();
                        this.renderIdeas();
                        this.updateCategoryCounts();
                    });
                });
                
                // Фильтрация по категориям
                document.addEventListener('click', (e) => {
                    if (e.target.closest('.category-item')) {
                        const categoryItem = e.target.closest('.category-item');
                        
                        // Если клик на активный элемент, сбрасываем фильтр
                        if (categoryItem.classList.contains('active')) {
                            this.appState.currentCategory = null;
                            document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
                        } else {
                            document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
                            categoryItem.classList.add('active');
                            this.appState.currentCategory = categoryItem.dataset.category;
                        }
                        
                        this.clearTagFilter();
                        this.clearImageFilter();
                        this.updateCurrentCategoryTitle();
                        this.renderIdeas();
                    }
                });
                
                // Поиск
                this.searchInput.addEventListener('input', () => {
                    this.updateSearchInterface();
                    this.renderIdeas();
                });
                
                // Очистка поиска
                this.searchClear.addEventListener('click', () => {
                    this.clearSearch();
                });
                
                // Очистка фильтров
                document.getElementById('clear-filter-btn').addEventListener('click', () => {
                    this.clearTagFilter();
                });
                document.getElementById('filter-tag').addEventListener('click', () => {
                    this.clearTagFilter();
                });
                document.getElementById('clear-image-filter').addEventListener('click', () => {
                    this.clearImageFilter();
                });
                document.querySelector('#image-filter-container .filter-tag').addEventListener('click', () => {
                    this.clearImageFilter();
                });
                
                // Очистка архива
                document.getElementById('clear-archive-btn').addEventListener('click', () => {
                    if (confirm('Вы уверены, что хотите удалить все архивные идеи? Это действие невозможно отменить.')) {
                        this.ideaManager.clearArchive();
                        this.updateCategoryCounts();
                        this.updateActiveArchivedCounts();
                        this.renderIdeas();
                        this.showToast('Архив успешно очищен');
                    }
                });
                
                // Управление категориями
                document.getElementById('add-category-btn').addEventListener('click', () => {
                    this.openCategoryModal();
                });
                document.getElementById('close-category-modal-btn').addEventListener('click', () => {
                    this.closeCategoryModal();
                });
                document.getElementById('cancel-category-btn').addEventListener('click', () => {
                    this.closeCategoryModal();
                });
                document.getElementById('save-category-btn').addEventListener('click', () => {
                    this.saveCategory();
                });
                document.getElementById('delete-category-btn').addEventListener('click', () => {
                    this.deleteCategory();
                });
                
                // Выбор цвета категории
                document.getElementById('color-picker').addEventListener('click', (e) => {
                    if (e.target.classList.contains('color-option')) {
                        document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
                        e.target.classList.add('selected');
                        this.appState.selectedColor = e.target.dataset.color;
                    }
                });
                
                // Кнопки загрузки изображения
                this.cameraBtn.addEventListener('click', () => {
                    this.openCamera();
                });
                
                this.galleryBtn.addEventListener('click', () => {
                    this.ideaImage.click();
                });
                
                // Загрузка изображения
                this.ideaImage.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        this.processImage(file);
                    }
                });
                
                this.ideaCamera.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        this.processImage(file);
                    }
                });
                
                // Импорт/экспорт
                document.getElementById('export-btn').addEventListener('click', () => {
                    this.exportData();
                });
                document.getElementById('import-btn').addEventListener('click', () => {
                    document.getElementById('import-file').click();
                });
                document.getElementById('import-file').addEventListener('change', (e) => {
                    this.importData(e);
                });
                
                // Закрытие модальных окон по клику вне их
                this.ideaModal.addEventListener('click', (e) => {
                    if (e.target === this.ideaModal) {
                        this.closeIdeaModal();
                    }
                });
                this.categoryModal.addEventListener('click', (e) => {
                    if (e.target === this.categoryModal) {
                        this.closeCategoryModal();
                    }
                });
                
                // Закрытие просмотра изображения
                this.imageViewer.addEventListener('click', () => {
                    this.closeImageViewer();
                });
                
                // Быстрое добавление идеи
                this.quickAddCancel.addEventListener('click', () => {
                    this.closeQuickAdd();
                });
                
                this.quickAddSave.addEventListener('click', () => {
                    this.saveQuickIdea();
                });
                
                this.quickAddInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        this.saveQuickIdea();
                    } else if (e.key === 'Escape') {
                        this.closeQuickAdd();
                    }
                });
            }
            
            // Открытие камеры - исправленный метод для корректной работы с основной камерой
            openCamera() {
                // Программно активируем скрытый input с атрибутом capture="camera"
                // Это открывает интерфейс камеры устройства вместо галереи
                this.ideaCamera.click();
            }
            
            // Обработка клика FAB с защитой от случайных нажатий
            handleFabClick(e) {
                e.preventDefault();
                
                const currentTime = Date.now();
                
                // Проверяем, не обрабатывается ли уже клик
                if (this.isFabClickProcessing) {
                    return;
                }
                
                // Проверяем, не слишком ли частые клики (защита от дребезга)
                if (currentTime - this.lastFabClickTime < 300) {
                    return;
                }
                
                // Если нужно игнорировать этот клик (после перетаскивания)
                if (this.ignoreNextClick) {
                    this.ignoreNextClick = false;
                    return;
                }
                
                // Если было долгое нажатие
                if (this.isLongPress) {
                    this.isLongPress = false;
                    
                    // Если было перемещение, ничего не делаем
                    if (this.hasMoved) {
                        return;
                    }
                    
                    // Если не было перемещения, показываем быстрое добавление
                    this.toggleQuickAdd();
                    return;
                }
                
                // Если было обычное нажатие (не долгое) и не было перемещения
                if (!this.hasMoved) {
                    // Устанавливаем флаг обработки клика
                    this.isFabClickProcessing = true;
                    this.lastFabClickTime = currentTime;
                    
                    // Открываем модальное окно
                    this.openIdeaModal();
                    
                    // Сбрасываем флаг после небольшой задержки
                    setTimeout(() => {
                        this.isFabClickProcessing = false;
                    }, 500);
                }
            }
            
            // Переключение быстрого добавления
            toggleQuickAdd() {
                this.quickAdd.classList.toggle('active');
                if (this.quickAdd.classList.contains('active')) {
                    this.quickAddInput.focus();
                }
            }
            
            // Закрытие быстрого добавления
            closeQuickAdd() {
                this.quickAdd.classList.remove('active');
                this.quickAddInput.value = '';
            }
            
            // Сохранение быстрой идеи
            saveQuickIdea() {
                const content = this.quickAddInput.value.trim();
                if (!content) return;
                
                this.ideaManager.addIdea({
                    title: 'Быстрая идея',
                    content: content,
                    category: null,
                    tags: ['Быстро'],
                    image: null
                });
                
                this.updateCategoryCounts();
                this.updateActiveArchivedCounts();
                this.renderIdeas();
                this.closeQuickAdd();
                this.showToast('Идея успешно создана');
            }
            
            // Обновление иконки темы
            updateThemeIcon() {
                if (this.appState.theme === 'dark') {
                    this.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
                } else {
                    this.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
                }
            }
            
            // Переключение бокового меню
            toggleSidebar() {
                this.appState.sidebarOpen = !this.appState.sidebarOpen;
                
                if (this.appState.sidebarOpen) {
                    this.sidebar.classList.add('open');
                    this.sidebarOverlay.classList.add('active');
                    this.menuToggle.innerHTML = '<i class="fas fa-times"></i>';
                } else {
                    this.closeSidebar();
                }
            }
            
            // Закрытие бокового меню
            closeSidebar() {
                this.appState.sidebarOpen = false;
                this.sidebar.classList.remove('open');
                this.sidebarOverlay.classList.remove('active');
                this.menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            }
            
            // Настройка перетаскивания FAB
            setupFabDragging() {
                // События для мыши
                this.fab.addEventListener('mousedown', (e) => {
                    this.startFabDrag(e.clientX, e.clientY);
                });
                document.addEventListener('mousemove', (e) => {
                    if (this.isDragging) {
                        this.dragFab(e.clientX, e.clientY);
                    }
                });
                document.addEventListener('mouseup', () => {
                    this.endFabDrag();
                });
                
                // События для касания
                this.fab.addEventListener('touchstart', (e) => {
                    const touch = e.touches[0];
                    this.startFabDrag(touch.clientX, touch.clientY);
                });
                document.addEventListener('touchmove', (e) => {
                    if (this.isDragging) {
                        const touch = e.touches[0];
                        this.dragFab(touch.clientX, touch.clientY);
                        e.preventDefault(); // Предотвращаем прокрутку страницы
                    }
                });
                document.addEventListener('touchend', () => {
                    this.endFabDrag();
                });
            }
            
            // Настройка обработки изменения ориентации экрана
            setupOrientationChange() {
                window.addEventListener('orientationchange', () => {
                    // Небольшая задержка, чтобы убедиться, что ориентация изменилась
                    setTimeout(() => {
                        this.adjustFabPosition();
                    }, 300);
                });
                
                // Также обрабатываем изменение размера окна
                window.addEventListener('resize', () => {
                    this.adjustFabPosition();
                });
            }
            
            // Корректировка позиции FAB при изменении ориентации
            adjustFabPosition() {
                const fabRect = this.fab.getBoundingClientRect();
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;
                const fabSize = this.fab.offsetWidth;
                const margin = 10; // Отступ от краев
                
                // Проверяем, находится ли кнопка за пределами видимой области
                if (fabRect.right > windowWidth) {
                    // Если кнопка выходит за правую границу
                    this.fab.style.right = `${margin}px`;
                    this.fab.style.left = 'auto';
                } else if (fabRect.left < 0) {
                    // Если кнопка выходит за левую границу
                    this.fab.style.left = `${margin}px`;
                    this.fab.style.right = 'auto';
                }
                
                if (fabRect.bottom > windowHeight) {
                    // Если кнопка выходит за нижнюю границу
                    this.fab.style.bottom = `${margin}px`;
                    this.fab.style.top = 'auto';
                } else if (fabRect.top < 0) {
                    // Если кнопка выходит за верхнюю границу
                    this.fab.style.top = `${margin}px`;
                    this.fab.style.bottom = 'auto';
                }
                
                // Сохраняем новую позицию
                const newFabRect = this.fab.getBoundingClientRect();
                localStorage.setItem('fabPosition', JSON.stringify({
                    left: newFabRect.left,
                    top: newFabRect.top
                }));
            }
            
            // Начало перетаскивания FAB
            startFabDrag(clientX, clientY) {
                this.isLongPress = false;
                this.ignoreNextClick = false;
                this.hasMoved = false; // Сбрасываем флаг перемещения
                
                // Устанавливаем таймер для определения долгого нажатия
                this.longPressTimer = setTimeout(() => {
                    this.isDragging = true;
                    this.isLongPress = true;
                    this.fab.classList.add('dragging');
                    
                    // Сохраняем начальные позиции
                    this.dragStartX = clientX;
                    this.dragStartY = clientY;
                    
                    const fabRect = this.fab.getBoundingClientRect();
                    this.fabStartX = fabRect.left;
                    this.fabStartY = fabRect.top;
                }, 500); // 500 мс для долгого нажатия
            }
            
            // Перетаскивание FAB
            dragFab(clientX, clientY) {
                if (!this.isDragging) return;
                
                // Отмечаем, что было перемещение
                this.hasMoved = true;
                
                // Вычисляем смещение
                const deltaX = clientX - this.dragStartX;
                const deltaY = clientY - this.dragStartY;
                
                // Новая позиция FAB
                let newX = this.fabStartX + deltaX;
                let newY = this.fabStartY + deltaY;
                
                // Ограничиваем перемещение в пределах окна
                const fabSize = this.fab.offsetWidth;
                const margin = 10;
                newX = Math.max(margin, Math.min(window.innerWidth - fabSize - margin, newX));
                newY = Math.max(margin, Math.min(window.innerHeight - fabSize - margin, newY));
                
                // Применяем новую позицию
                this.fab.style.left = `${newX}px`;
                this.fab.style.top = `${newY}px`;
                this.fab.style.right = 'auto';
                this.fab.style.bottom = 'auto';
            }
            
            // Окончание перетаскивания FAB
            endFabDrag() {
                // Сбрасываем таймер долгого нажатия
                if (this.longPressTimer) {
                    clearTimeout(this.longPressTimer);
                    this.longPressTimer = null;
                }
                
                // Если было перетаскивание
                if (this.isDragging) {
                    this.isDragging = false;
                    this.fab.classList.remove('dragging');
                    this.ignoreNextClick = true;
                    
                    // Сохраняем позицию FAB в localStorage
                    const fabRect = this.fab.getBoundingClientRect();
                    localStorage.setItem('fabPosition', JSON.stringify({
                        left: fabRect.left,
                        top: fabRect.top
                    }));
                }
                
                // Всегда сбрасываем флаг долгого нажатия
                this.isLongPress = false;
            }
            
            // Восстановление позиции FAB
            restoreFabPosition() {
                this.resetFabFlags();
                
                const savedPosition = localStorage.getItem('fabPosition');
                if (savedPosition) {
                    try {
                        const position = JSON.parse(savedPosition);
                        
                        // Проверяем, что позиция в пределах видимой области
                        const fabSize = this.fab.offsetWidth;
                        const margin = 10;
                        
                        if (position.left >= margin && 
                            position.left <= window.innerWidth - fabSize - margin &&
                            position.top >= margin && 
                            position.top <= window.innerHeight - fabSize - margin) {
                            
                            this.fab.style.left = `${position.left}px`;
                            this.fab.style.top = `${position.top}px`;
                            this.fab.style.right = 'auto';
                            this.fab.style.bottom = 'auto';
                            return;
                        }
                    } catch (e) {
                        console.error('Error restoring FAB position:', e);
                    }
                }
                
                // Если сохраненная позиция недействительна, используем позицию по умолчанию
                this.fab.style.left = 'auto';
                this.fab.style.top = 'auto';
                this.fab.style.right = '2rem';
                this.fab.style.bottom = '2rem';
            }
            
            // Сброс всех флагов FAB
            resetFabFlags() {
                this.isFabClickProcessing = false;
                this.ignoreNextClick = false;
                this.isLongPress = false;
                this.lastFabClickTime = 0;
                this.hasMoved = false;
                
                if (this.longPressTimer) {
                    clearTimeout(this.longPressTimer);
                    this.longPressTimer = null;
                }
            }
            
            // Обновление интерфейса поиска
            updateSearchInterface() {
                const searchValue = this.searchInput.value;
                
                // Показываем или скрываем крестик очистки
                if (searchValue.length > 0) {
                    this.searchClear.classList.add('visible');
                } else {
                    this.searchClear.classList.remove('visible');
                }
            }
            
            // Очистка поля поиска
            clearSearch() {
                this.searchInput.value = '';
                this.updateSearchInterface();
                this.renderIdeas();
            }
            
            // Обновление заголовка текущей категории
            updateCurrentCategoryTitle() {
                if (this.appState.currentView === 'archived') {
                    if (this.appState.currentCategory === null) {
                        this.currentCategoryElement.textContent = 'Архив';
                    } else if (this.appState.currentCategory === 'none') {
                        this.currentCategoryElement.textContent = 'Архив: Без категории';
                    } else {
                        const category = this.categoryManager.getCategoryById(this.appState.currentCategory);
                        this.currentCategoryElement.textContent = category ? `Архив: ${category.name}` : 'Архив';
                    }
                } else {
                    if (this.appState.currentCategory === null) {
                        this.currentCategoryElement.textContent = 'Мои идеи';
                    } else if (this.appState.currentCategory === 'none') {
                        this.currentCategoryElement.textContent = 'Мои идеи: Без категории';
                    } else {
                        const category = this.categoryManager.getCategoryById(this.appState.currentCategory);
                        this.currentCategoryElement.textContent = category ? `Мои идеи: ${category.name}` : 'Мои идеи';
                    }
                }
            }
            
            // Обработка изображения
            processImage(file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        // Определяем максимальные размеры
                        const maxSize = 360; // Максимальный размер = 360px
                        
                        // Создаем canvas для масштабирования
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        // Вычисляем новые размеры с сохранением пропорций
                        let newWidth = img.width;
                        let newHeight = img.height;
                        
                        if (img.width > maxSize || img.height > maxSize) {
                            const ratio = Math.min(maxSize / img.width, maxSize / img.height);
                            newWidth = img.width * ratio;
                            newHeight = img.height * ratio;
                        }
                        
                        canvas.width = newWidth;
                        canvas.height = newHeight;
                        
                        // Рисуем изображение на canvas
                        ctx.drawImage(img, 0, 0, newWidth, newHeight);
                        
                        // Получаем dataURL с максимальным качеством (100%)
                        const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
                        
                        // Сохраняем изображение
                        this.appState.currentImageData = dataUrl;
                        
                        // Отображаем превью
                        this.imagePreview.src = dataUrl;
                        this.imagePreview.style.display = 'block';
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
            
            // Открытие модального окна идеи
            openIdeaModal(ideaId = null) {
                // Сбрасываем все флаги перед открытием модального окна
                this.resetFabFlags();
                
                // Временно скрываем FAB, чтобы избежать случайных нажатий
                this.fab.style.visibility = 'hidden';
                
                this.appState.currentIdeaId = ideaId;
                const modalTitle = document.getElementById('modal-title');
                const ideaTitleInput = document.getElementById('idea-title');
                const ideaContentInput = document.getElementById('idea-content');
                const ideaCategorySelect = document.getElementById('idea-category');
                
                if (ideaId) {
                    // Редактирование существующей идеи
                    const idea = this.appState.ideas.find(i => i.id === ideaId);
                    if (idea) {
                        modalTitle.textContent = 'Редактировать идею';
                        ideaTitleInput.value = idea.title;
                        ideaContentInput.value = idea.content;
                        ideaCategorySelect.value = idea.category || '';
                        this.appState.tags = idea.tags || [];
                        
                        if (idea.image) {
                            this.appState.currentImageData = idea.image;
                            this.imagePreview.src = idea.image;
                            this.imagePreview.style.display = 'block';
                        } else {
                            this.appState.currentImageData = null;
                            this.imagePreview.style.display = 'none';
                        }
                    }
                } else {
                    // Создание новой идеи
                    modalTitle.textContent = 'Новая идея';
                    document.getElementById('idea-form').reset();
                    this.appState.tags = [];
                    this.appState.currentImageData = null;
                    this.imagePreview.style.display = 'none';
                }
                
                this.renderTags();
                this.ideaModal.classList.add('active');
                
                // Восстанавливаем видимость FAB после небольшой задержки
                setTimeout(() => {
                    this.fab.style.visibility = '';
                }, 300);
            }
            
            // Закрытие модального окна идеи
            closeIdeaModal() {
                this.ideaModal.classList.remove('active');
                document.getElementById('idea-form').reset();
                this.appState.tags = [];
                this.appState.currentImageData = null;
                this.imagePreview.style.display = 'none';
                
                // Сбрасываем флаги после закрытия модального окна
                this.resetFabFlags();
            }
            
            // Сохранение идеи
            saveIdea() {
                const titleInput = document.getElementById('idea-title');
                const contentInput = document.getElementById('idea-content');
                
                // Автоматическое заполнение полей, если они пустые
                const title = titleInput.value.trim() || 'Новая идея';
                const content = contentInput.value.trim() || 'Что нибудь когда нибудь придумам';
                const category = document.getElementById('idea-category').value;
                const tags = this.appState.tags.length > 0 ? [...this.appState.tags] : ['Быстро'];
                
                if (this.appState.currentIdeaId) {
                    // Обновление существующей идеи
                    this.ideaManager.updateIdea(this.appState.currentIdeaId, {
                        title,
                        content,
                        category: category || null,
                        tags,
                        image: this.appState.currentImageData
                    });
                    this.showToast('Идея успешно обновлена');
                } else {
                    // Создание новой идеи
                    this.ideaManager.addIdea({
                        title,
                        content,
                        category: category || null,
                        tags,
                        image: this.appState.currentImageData
                    });
                    this.showToast('Идея успешно создана');
                }
                
                this.updateCategoryCounts();
                this.updateActiveArchivedCounts();
                this.renderIdeas();
                this.closeIdeaModal();
            }
            
            // Переключение архивации идеи
            toggleArchiveIdea(ideaId) {
                const idea = this.ideaManager.toggleArchive(ideaId);
                if (idea) {
                    this.updateCategoryCounts();
                    this.updateActiveArchivedCounts();
                    this.renderIdeas();
                    this.showToast(idea.archived ? 'Идея архивирована' : 'Идея восстановлена');
                }
            }
            
            // Переключение закрепления идеи
            togglePinIdea(ideaId) {
                const idea = this.ideaManager.togglePin(ideaId);
                if (idea) {
                    this.renderIdeas();
                    this.showToast(idea.pinned ? 'Идея закреплена' : 'Идея откреплена');
                }
            }
            
            // Удаление идеи
            deleteIdea(ideaId) {
                if (confirm('Вы уверены, что хотите удалить эту идею?')) {
                    this.ideaManager.deleteIdea(ideaId);
                    this.updateCategoryCounts();
                    this.updateActiveArchivedCounts();
                    this.renderIdeas();
                    this.showToast('Идея удалена');
                }
            }
            
            // Открытие модального окна категории
            openCategoryModal(categoryId = null) {
                this.appState.currentCategoryId = categoryId;
                const modalTitle = document.getElementById('category-modal-title');
                const categoryNameInput = document.getElementById('category-name');
                const deleteBtn = document.getElementById('delete-category-btn');
                
                if (categoryId && categoryId !== 'none') {
                    // Редактирование существующей категории
                    const category = this.appState.categories.find(c => c.id === categoryId);
                    if (category) {
                        modalTitle.textContent = 'Редактировать категорию';
                        categoryNameInput.value = category.name;
                        
                        document.querySelectorAll('.color-option').forEach(opt => {
                            opt.classList.remove('selected');
                            if (opt.dataset.color === category.color) {
                                opt.classList.add('selected');
                                this.appState.selectedColor = category.color;
                            }
                        });
                        
                        deleteBtn.style.display = 'block';
                    }
                } else {
                    // Создание новой категории
                    modalTitle.textContent = 'Новая категория';
                    document.getElementById('category-form').reset();
                    document.querySelector('.color-option').classList.add('selected');
                    this.appState.selectedColor = '#f59e0b';
                    deleteBtn.style.display = 'none';
                }
                
                this.categoryModal.classList.add('active');
            }
            
            // Закрытие модального окна категории
            closeCategoryModal() {
                this.categoryModal.classList.remove('active');
                document.getElementById('category-form').reset();
            }
            
            // Сохранение категории
            saveCategory() {
                const name = document.getElementById('category-name').value.trim();
                
                if (!name) {
                    this.showToast('Пожалуйста, введите название категории', 'error');
                    return;
                }
                
                if (this.appState.currentCategoryId && this.appState.currentCategoryId !== 'none') {
                    // Обновление существующей категории
                    this.categoryManager.updateCategory(this.appState.currentCategoryId, {
                        name,
                        color: this.appState.selectedColor
                    });
                    this.showToast('Категория успешно обновлена');
                } else {
                    // Создание новой категории
                    this.categoryManager.addCategory({
                        name,
                        color: this.appState.selectedColor
                    });
                    this.showToast('Категория успешно создана');
                }
                
                this.renderCategories();
                this.updateCategoryCounts();
                this.updateCategorySelect();
                this.renderIdeas();
                this.closeCategoryModal();
            }
            
            // Удаление категории
            deleteCategory() {
                if (confirm('Вы уверены, что хотите удалить эту категорию? Все идеи в этой категории будут помечены как "Без категории".')) {
                    this.categoryManager.deleteCategory(this.appState.currentCategoryId);
                    this.renderCategories();
                    this.updateCategoryCounts();
                    this.updateCategorySelect();
                    this.renderIdeas();
                    this.closeCategoryModal();
                    this.showToast('Категория удалена');
                }
            }
            
            // Отображение тегов в форме
            renderTags() {
                const tagsContainer = document.getElementById('tags-container');
                const tagsHTML = this.appState.tags.map(tag => `
                    <div class="tag-item">
                        ${tag}
                        <button type="button" class="tag-remove" data-tag="${tag}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `).join('');
                
                tagsContainer.innerHTML = tagsHTML + `
                    <input type="text" class="tags-input" id="idea-tags" placeholder="Добавьте тег и нажмите Enter">
                `;
                
                // Обработчик для добавления тега
                const tagsInput = document.getElementById('idea-tags');
                tagsInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        const tagValue = tagsInput.value.trim();
                        if (tagValue && !this.appState.tags.includes(tagValue)) {
                            this.appState.tags.push(tagValue);
                            this.renderTags();
                            tagsInput.focus();
                        }
                    }
                });
                
                // Обработчики для удаления тегов
                document.querySelectorAll('.tag-remove').forEach(btn => {
                    btn.addEventListener('click', () => {
                        this.appState.tags = this.appState.tags.filter(tag => tag !== btn.dataset.tag);
                        this.renderTags();
                    });
                });
            }
            
            // Установка фильтра по тегу
            setTagFilter(tag) {
                this.appState.currentTag = tag;
                this.filterContainer.classList.add('active');
                this.filterTagText.textContent = tag;
                this.renderIdeas();
            }
            
            // Очистка фильтра по тегу
            clearTagFilter() {
                this.appState.currentTag = null;
                this.filterContainer.classList.remove('active');
                this.renderIdeas();
            }
            
            // Установка фильтра по изображению
            setImageFilter() {
                this.appState.filterByImage = true;
                this.imageFilterContainer.classList.add('active');
                this.renderIdeas();
            }
            
            // Очистка фильтра по изображению
            clearImageFilter() {
                this.appState.filterByImage = false;
                this.imageFilterContainer.classList.remove('active');
                this.renderIdeas();
            }
            
            // Экспорт данных
            exportData() {
                const data = {
                    ideas: this.appState.ideas,
                    categories: this.appState.categories,
                    exportDate: new Date().toISOString()
                };
                
                const dataStr = JSON.stringify(data, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                
                const link = document.createElement('a');
                link.href = URL.createObjectURL(dataBlob);
                link.download = 'ideas_backup_' + new Date().toISOString().split('T')[0] + '.json';
                link.click();
                
                this.showToast('Данные успешно экспортированы');
            }
            
            // Импорт данных
            importData(e) {
                const file = e.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const data = JSON.parse(event.target.result);
                        
                        if (data.ideas && Array.isArray(data.ideas)) {
                            this.appState.ideas = data.ideas;
                        }
                        
                        if (data.categories && Array.isArray(data.categories)) {
                            this.appState.categories = data.categories;
                        }
                        
                        this.appState.saveToStorage();
                        this.renderCategories();
                        this.updateCategoryCounts();
                        this.updateActiveArchivedCounts();
                        this.updateCategorySelect();
                        this.renderIdeas();
                        
                        this.showToast('Данные успешно импортированы');
                    } catch (error) {
                        this.showToast('Ошибка при импорте данных', 'error');
                        console.error('Import error:', error);
                    }
                };
                reader.readAsText(file);
                
                // Очистка поля ввода файла
                e.target.value = '';
            }
            
            // Открытие просмотра изображения
            openImageViewer(imageSrc) {
                this.viewerImage.src = imageSrc;
                this.imageViewer.classList.add('active');
            }
            
            // Закрытие просмотра изображения
            closeImageViewer() {
                this.imageViewer.classList.remove('active');
            }
            
            // Отображение идей
            renderIdeas() {
                const searchTerm = this.searchInput.value.toLowerCase();
                const filteredIdeas = this.appState.getFilteredIdeas(searchTerm);
                
                if (filteredIdeas.length === 0) {
                    this.ideasList.style.display = 'none';
                    this.emptyState.style.display = 'flex';
                    
                    if (this.appState.filterByImage) {
                        this.emptyState.innerHTML = `
                            <i class="fas fa-image"></i>
                            <h3>Нет идей с изображениями</h3>
                            <p>Добавьте изображения к идеям или сбросьте фильтр</p>
                        `;
                    } else if (this.appState.currentTag) {
                        this.emptyState.innerHTML = `
                            <i class="fas fa-tag"></i>
                            <h3>Нет идей с тегом "${this.appState.currentTag}"</h3>
                            <p>Попробуйте другой тег или сбросьте фильтр</p>
                        `;
                    } else if (searchTerm) {
                        this.emptyState.innerHTML = `
                            <i class="fas fa-search"></i>
                            <h3>Нет подходящих идей</h3>
                            <p>Попробуйте другой поисковый запрос</p>
                        `;
                    } else if (this.appState.currentView === 'archived') {
                        this.emptyState.innerHTML = `
                            <i class="fas fa-archive"></i>
                            <h3>Нет архивированных идей</h3>
                            <p>Архивируйте некоторые идеи, чтобы увидеть их здесь</p>
                        `;
                    } else if (this.appState.currentCategory === 'none') {
                        this.emptyState.innerHTML = `
                            <i class="fas fa-folder-open"></i>
                            <h3>Нет идей без категории</h3>
                            <p>Добавьте идеи без категории или выберите другую категорию</p>
                        `;
                    } else {
                        this.emptyState.innerHTML = `
                            <i class="fas fa-lightbulb"></i>
                            <h3>Пока нет идей</h3>
                            <p>Нажмите на плюс, чтобы добавить свою первую идею</p>
                        `;
                    }
                } else {
                    this.ideasList.style.display = 'flex';
                    this.emptyState.style.display = 'none';
                    
                    // Создаем HTML для карточек
                    const ideasHTML = filteredIdeas.map(idea => {
                        const category = this.categoryManager.getCategoryById(idea.category);
                        const lightColor = category ? category.lightColor : '#f9fafb';
                        const categoryName = category ? category.name : 'Без категории';
                        const categoryColor = category ? category.color : '#d1d5db';
                        const formattedDate = new Date(idea.createdAt).toLocaleDateString('ru-RU', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                        });
                        const formattedTime = new Date(idea.createdAt).toLocaleTimeString('ru-RU', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        });
                        
                        return `
                            <div class="idea-card ${idea.pinned ? 'pinned' : ''}" data-id="${idea.id}" style="background-color: ${lightColor}; --category-color: ${categoryColor};">
                                <div class="idea-content-wrapper">
                                    ${idea.image ? `
                                        <div class="idea-image-container" data-image="${idea.image}">
                                            <img src="${idea.image}" alt="Изображение идеи" class="idea-image">
                                        </div>
                                    ` : ''}
                                    <div class="idea-main">
                                        <div class="idea-header">
                                            <div>
                                                <div class="idea-title">${idea.title}</div>
                                                <div class="idea-category">
                                                    <div class="category-dot" style="background-color: ${categoryColor};"></div>
                                                    ${categoryName}
                                                </div>
                                            </div>
                                        </div>
                                        <div class="idea-content">${idea.content}</div>
                                        <div class="idea-footer">
                                            <div class="idea-date">${formattedDate} в ${formattedTime}</div>
                                            <div class="idea-tags">
                                                ${(idea.tags || []).map(tag => 
                                                    `<span class="tag" data-tag="${tag}">${tag}</span>`
                                                ).join('')}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="idea-actions">
                                    <button class="action-btn pin-btn ${idea.pinned ? 'pinned' : ''}" data-id="${idea.id}">
                                        <i class="fas fa-thumbtack"></i>
                                    </button>
                                    <button class="action-btn edit-btn" data-id="${idea.id}">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="action-btn archive-btn" data-id="${idea.id}">
                                        <i class="fas fa-${idea.archived ? 'undo' : 'archive'}"></i>
                                    </button>
                                    <button class="action-btn delete-btn" data-id="${idea.id}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('');
                    
                    // Очищаем список и добавляем пустое пространство сверху
                    this.ideasList.innerHTML = `
                        <div class="empty-space empty-space-top"></div>
                        ${ideasHTML}
                        <div class="empty-space empty-space-bottom"></div>
                    `;
                    
                    // Устанавливаем высоту пустых пространств равной половине высоты карточки
                    setTimeout(() => {
                        const firstCard = this.ideasList.querySelector('.idea-card');
                        if (firstCard) {
                            const cardHeight = firstCard.offsetHeight;
                            const emptySpaces = this.ideasList.querySelectorAll('.empty-space');
                            emptySpaces.forEach(space => {
                                space.style.height = `${cardHeight / 2}px`;
                            });
                        }
                    }, 0);
                    
                    // Обработчики для кнопок действий
                    document.querySelectorAll('.pin-btn').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.togglePinIdea(btn.dataset.id);
                        });
                    });
                    
                    document.querySelectorAll('.edit-btn').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.openIdeaModal(btn.dataset.id);
                        });
                    });
                    
                    document.querySelectorAll('.archive-btn').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.toggleArchiveIdea(btn.dataset.id);
                        });
                    });
                    
                    document.querySelectorAll('.delete-btn').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.deleteIdea(btn.dataset.id);
                        });
                    });
                    
                    // Обработчики для тегов
                    document.querySelectorAll('.tag').forEach(tag => {
                        tag.addEventListener('click', (e) => {
                            this.setTagFilter(tag.dataset.tag);
                        });
                    });
                    
                    // Обработчики для раскрытия карточек
                    document.querySelectorAll('.idea-card').forEach(card => {
                        card.addEventListener('click', (e) => {
                            // Проверяем, что клик был не по тегу и не по кнопке действия
                            if (!e.target.closest('.tag') && !e.target.closest('.action-btn')) {
                                card.classList.toggle('expanded');
                            }
                        });
                    });
                    
                    // Обработчики для изображений
                    document.querySelectorAll('.idea-image-container').forEach(container => {
                        const imageSrc = container.dataset.image;
                        
                        // Обработчик для долгого нажатия
                        let pressTimer;
                        let isLongPress = false;
                        
                        const startPress = () => {
                            pressTimer = setTimeout(() => {
                                isLongPress = true;
                                this.openImageViewer(imageSrc);
                            }, 500);
                        };
                        
                        const endPress = () => {
                            clearTimeout(pressTimer);
                            setTimeout(() => {
                                isLongPress = false;
                            }, 100);
                        };
                        
                        // События для мыши
                        container.addEventListener('mousedown', startPress);
                        container.addEventListener('mouseup', endPress);
                        container.addEventListener('mouseleave', endPress);
                        
                        // События для касания
                        container.addEventListener('touchstart', startPress);
                        container.addEventListener('touchend', endPress);
                        container.addEventListener('touchcancel', endPress);
                        
                        // Обработчик клика
                        container.addEventListener('click', (e) => {
                            if (!isLongPress) {
                                // Обычный клик - устанавливаем фильтр по изображениям
                                this.setImageFilter();
                            }
                        });
                    });
                }
            }
            
            // Отображение категорий
            renderCategories() {
                const categoriesHTML = this.appState.categories.map(category => `
                    <div class="category-item" data-category="${category.id}">
                        <div class="category-name">
                            <div class="category-color" style="background-color: ${category.color};"></div>
                            <span>${category.name}</span>
                        </div>
                        <div class="category-count" id="count-${category.id}">0</div>
                        <div class="category-actions">
                            <button class="category-action-btn edit-category-btn" data-id="${category.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="category-action-btn delete-category-btn" data-id="${category.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('');
                
                // Для категории "Без категории" не добавляем кнопки действий
                this.categoriesList.innerHTML = `
                    <div class="category-item" data-category="none">
                        <div class="category-name">
                            <div class="category-color" style="background-color: #d1d5db;"></div>
                            <span>Без категории</span>
                        </div>
                        <div class="category-count" id="count-none">0</div>
                    </div>
                ` + categoriesHTML;
                
                // Обработчики для кнопок редактирования категорий
                document.querySelectorAll('.edit-category-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.openCategoryModal(btn.dataset.id);
                    });
                });
                
                // Обработчики для кнопок удаления категорий
                document.querySelectorAll('.delete-category-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (confirm('Вы уверены, что хотите удалить эту категорию? Все идеи в этой категории будут помечены как "Без категории".')) {
                            this.categoryManager.deleteCategory(btn.dataset.id);
                            this.renderCategories();
                            this.updateCategoryCounts();
                            this.updateCategorySelect();
                            this.renderIdeas();
                            this.showToast('Категория удалена');
                        }
                    });
                });
            }
            
            // Обновление счетчиков категорий
            updateCategoryCounts() {
                // Счетчик для "Без категории"
                const noneCount = this.appState.ideas.filter(idea => 
                    idea.category === null && 
                    (this.appState.currentView === 'archived' ? idea.archived : !idea.archived)
                ).length;
                const countNoneElement = document.getElementById('count-none');
                if (countNoneElement) {
                    countNoneElement.textContent = noneCount;
                }
                
                // Счетчики для категорий
                this.appState.categories.forEach(category => {
                    const count = this.categoryManager.countIdeasInCategory(category.id);
                    const countElement = document.getElementById(`count-${category.id}`);
                    if (countElement) {
                        countElement.textContent = count;
                    }
                });
            }
            
            // Обновление счетчиков активных и архивных идей
            updateActiveArchivedCounts() {
                const activeCount = this.appState.getActiveIdeasCount();
                const archivedCount = this.appState.getArchivedIdeasCount();
                
                if (this.activeCount) {
                    this.activeCount.textContent = activeCount;
                }
                
                if (this.archivedCount) {
                    this.archivedCount.textContent = archivedCount;
                }
            }
            
            // Обновление списка категорий в форме
            updateCategorySelect() {
                const ideaCategorySelect = document.getElementById('idea-category');
                const options = '<option value="">Выберите категорию</option>' + 
                    this.appState.categories.map(category => 
                        `<option value="${category.id}">${category.name}</option>`
                    ).join('');
                ideaCategorySelect.innerHTML = options;
            }
            
            // Показ уведомления
            showToast(message, type = 'success') {
                this.toastMessage.textContent = message;
                this.toast.classList.add('show');
                
                setTimeout(() => {
                    this.toast.classList.remove('show');
                }, 3000);
            }
        }
        
        // Инициализация приложения
        document.addEventListener('DOMContentLoaded', () => {
            const appState = new AppState();
            appState.loadFromStorage();
            
            const ideaManager = new IdeaManager(appState);
            const categoryManager = new CategoryManager(appState);
            const uiManager = new UIManager(appState, ideaManager, categoryManager);
            
            // Делаем uiManager доступным глобально для обработчиков событий в HTML
            window.uiManager = uiManager;
            
            uiManager.init();
            
            // Восстанавливаем позицию FAB после инициализации
            uiManager.restoreFabPosition();
            
            // Добавим глобальный обработчик для сброса флагов при фокусе окна
            window.addEventListener('focus', () => {
                if (window.uiManager) {
                    window.uiManager.resetFabFlags();
                }
            });
            
            // Добавим обработчик для видимости страницы
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden && window.uiManager) {
                    window.uiManager.resetFabFlags();
                }
            });
        });