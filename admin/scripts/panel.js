const body = document.querySelector("body");
const nav = document.querySelector("nav");
const sidebarToggle = document.querySelector(".sidebar-toggle");
const content = document.getElementById("content");

sidebarToggle.addEventListener("click", () => {
    nav.classList.toggle("close");
});

function messageToast(message) {
    const snackbar = document.getElementById("snackbar");
    snackbar.textContent = message;
    snackbar.className = "show";
    setTimeout(() => {
        snackbar.className = snackbar.className.replace("show", "");
    }, 3000);
}

async function loadPage(page) {
    try {
        const response = await fetch(`/admin/pages/${page}.html`);
        if (!response.ok) throw new Error('Page not found');
        const html = await response.text();
        content.innerHTML = html;
        initializePage(page);
    } catch (error) {
        console.error('Error loading page:', error);
        messageToast('حدث خطأ في تحميل الصفحة');
    }
}

function initializePage(page) {
    switch (page) {
        case 'dashboard':
            initializeDashboard();
            break;
        case 'news':
            initializeNews();
            break;
        case 'seasons':
            initializeSeasons();
            break;
        case 'recrecommendations':
            initializeRecommendations();
            break;
        case 'users':
            initializeUsers();
            break;
        case 'notifications':
            initializeNotifications();
            break;
        case 'reports':
            initializeReports();
            break;
        case 'words':
            initializeWords();
            break;
        case 'settings':
            initializeSettings();
            break;
        case 'profile':
            initializeProfile();
            break;
    }
}

async function initializeDashboard() {
    try {
        const [usersCount, newsCount, seasonsCount,recommendationsCount] = await Promise.all([
            fetch(' http://192.168.53.174:3000/dashboard/users/count').then(res => res.json()),
            fetch('http://192.168.53.174:3000/dashboard/news/count').then(res => res.json()),
            fetch('http://192.168.53.174:3000/dashboard/seasons/count').then(res => res.json()),
            fetch('http://192.168.53.174:3000/dashboard/recommendations/count').then(res => res.json())
        ]);
        console.log(newsCount);
        

        document.getElementById('users-count').textContent = usersCount.usersCount;
        document.getElementById('news-count').textContent = newsCount.newsCount;
        document.getElementById('seasons-count').textContent = seasonsCount.seasonsCount;
        document.getElementById('recommendations-count').textContent = recommendationsCount.recommendationsCount;
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        messageToast('حدث خطأ في تحميل البيانات');
    }
}

async function initializeNews() {
    const editor = new FroalaEditor('#news-content', {
        language: 'ar',
        direction: 'rtl'
    });

    try {
        const response = await fetch('/news');
        const news = await response.json();
        displayNews(news.data);
    } catch (error) {
        console.error('Error fetching news:', error);
        messageToast('حدث خطأ في تحميل الأخبار');
    }

}

function displayNews(news) {
    console.log(news);
    
    const newsContainer = document.getElementById('news-list');
    newsContainer.innerHTML = news.map(item => `
        <div class="news-item">
            <h3>${item.title}</h3>
            <p>${item.content.substring(0, 100)}...</p>
            <div class="actions">
                <button onclick="editNews(${item.id})">تعديل</button>
                <button onclick="deleteNews(${item.id})">حذف</button>
            </div>
        </div>
    `).join('');
}

async function initializeSeasons() {
    try {

        const response = await fetch('http://192.168.53.174:3000/seasons/control-panel', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const seasons = await response.json();
        displaySeasons(seasons.data);
        console.log(seasons);

        const animeForm = document.getElementById('anime-form');
        if (animeForm) {
            animeForm.addEventListener('submit', async (e) => {

            e.preventDefault();
            const token = localStorage.getItem('token');
            if (!token) {
                messageToast('يرجى تسجيل الدخول اولا');
                return;
            }
            
            const formData = {
                animeId: document.getElementById('animeId').value,
                summary: document.getElementById('summary').value,
            };
            
            try {
                const response = await fetch('/seasons', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`

                    },
                    body: JSON.stringify(formData)
                });
                
                if (response.ok) {
                    messageToast('تم إضافة الأنمي بنجاح');
                    document.getElementById('anime-form').reset();
                    // loadAnime();
                } else {
                    throw new Error('فشل في إضافة الأنمي');
                }
            } catch (error) {
                console.error('Error:', error);
                messageToast('حدث خطأ أثناء إضافة الأنمي');
            }
        });
        }

        document.getElementById('dialog-cancel').addEventListener('click', closeDialog);
    } catch (error) {
        console.error('Error fetching anime:', error);
        messageToast('حدث خطأ في تحميل الأنمي');
    }



}


function displaySeasons(anime) {
    const animeContainer = document.getElementById('anime-list');
    animeContainer.innerHTML = anime.map(item => {
        const user = item.User || {}; 
        return `
            <div class="anime-item">
                <img class="cover" src="${item.imageUrl}" alt="${item.title}">
                <div class="info">
                   <p>${item.title.substring(0, 100)}</p>
                <div style="display: flex; align-items: center; gap: 10px;"><img class="avatar avatar-${user.role || 0} mini" src="${user.avatar || 'default-avatar.png'}" alt="${user.username || 'Unknown'}"/>${user.username || 'Unknown'}</div>
                
                </div>
                <div class="actions">
                   <div class="buttons">
                        <button class="btn btn-primary" onclick="openEditAnimeDialog(${item.id},'${item.mal_id}', '${item.summary}')">تعديل</button>
                        <button class="btn btn-primary" id="ads-toggle-${item.id}" onclick="toggleAds(${item.id}, this)">
                            ${item.allowAds ? 'إغلاق الإعلانات' : 'تفعيل الإعلانات'}
                        </button>
                        <button class="btn btn-danger" onclick="deleteAnime(${item.id})">حذف</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    animeContainer.innerHTML += `
    <div class="anime-item add-anime">
    <button class="btn btn-success" style="border: none; width: 100%; height: 100%;" onclick="openAddAnimeForm()">+</button>
       
    </div>
`;
}

function deleteAnime(id) {
    if (confirm('هل انت متاكد من حذف الأنمي؟')) {
        fetch(`/seasons/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => {
            if (response.ok) {
                messageToast('تم حذف الأنمي بنجاح');
                // initializeSeasons();
            } else {
                throw new Error('فشل في حذف الأنمي');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            messageToast('حدث خطأ في حذف الأنمي');
        });
    }
}
function openAddAnimeForm() {
    const dialog = document.getElementById('anime-dialog');
    document.getElementById('dialog-title').textContent = 'إضافة أنمي';
    document.getElementById('dialog-animeId').value = '';
    document.getElementById('dialog-summary').value = '';
    dialog.style.display = 'flex';
}

function openEditAnimeDialog(id,animeId, currentSummary) {
    const dialog = document.getElementById('anime-dialog');
    document.getElementById('dialog-title').textContent = 'تعديل الأنمي';
    document.getElementById('season-id').value = id;

    document.getElementById('dialog-animeId').value = animeId;
    document.getElementById('dialog-summary').value = currentSummary;
    dialog.style.display = 'flex';
}
function closeDialog() {
    const dialog = document.getElementById('anime-dialog');
    dialog.style.display = 'none';
}
async function toggleAds(animeId, button) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            messageToast('يرجى تسجيل الدخول أولاً');
            return;
        }

        const currentState = button.innerText.includes('إغلاق');
        const newState = !currentState;

        button.innerText = newState ? 'إغلاق الإعلانات' : 'تفعيل الإعلانات';
 
        const response = await fetch(`http://192.168.53.174:3000/seasons/${animeId}/ads`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ allowAds: newState })
        });

        if (!response.ok) {
            throw new Error('فشل في تحديث حالة الإعلانات');
        }

        messageToast('تم تحديث حالة الإعلانات بنجاح');
    } catch (error) {
        console.error('Error:', error);
        messageToast('حدث خطأ أثناء تغيير حالة الإعلانات');

         const currentState = button.innerText.includes('إغلاق');
        button.innerText = currentState ? 'إغلاق الإعلانات' : 'تفعيل الإعلانات';
    }
}

async function initializeRecommendations() {
    try {
        const response = await fetch('/recommendations');
        const recommendations = await response.json();
        displayRecommendations(recommendations);
    } catch (error) {
        console.error('Error fetching anime:', error);
        messageToast('حدث خطأ في تحميل الأنمي');
    }
}


function displayRecommendations(anime) {
    const animeContainer = document.getElementById('anime-list');
    animeContainer.innerHTML = anime.map(item => `
        <div class="anime-item">
            <img src="${item.imageUrl}" alt="${item.title}">
            <h3>${item.title}</h3>
            <p>${item.summary.substring(0, 100)}...</p>
            <div class="actions">
                <button onclick="editAnime(${item.id})">تعديل</button>
                <button onclick="deleteAnime(${item.id})">حذف</button>
            </div>
        </div>
    `).join('');
}

async function initializeUsers() {
    try {
        const response = await fetch('/users/all');
        const users = await response.json();
        displayUsers(users.users);
    } catch (error) {
        console.error('Error fetching users:', error);
        messageToast('حدث خطأ في تحميل المستخدمين');
    }
}

function displayUsers(users) {
    console.log(users);

    const usersContainer = document.getElementById('users-list');
    usersContainer.innerHTML = users.map(user => `
        <div class="user-item">
            <img class="avatar avatar-${user.role || 0}" src="${user.avatar}" alt="${user.username}">
            <h3>${user.username}</h3>
            <p> ${translateRole(user.role)}</p>
            <p class="status-${user.isBanned ? "banned" : "active"}">${user.isBanned ? "محظور" : "مفعل"}</p>

            <div class="actions">
               <button class="action-btn edit-btn" onclick="editUser(${user.id})" title="تعديل">
                    <i class="uil uil-edit"></i>
                </button>

                 <button class="action-btn ${user.isBanned ? 'unban-btn' : 'ban-btn'}" onclick="deleteUser(${user.id})" title="حذف">
                    <i class="${user.isBanned ? 'uil uil-lock-alt"' : 'uil uil-lock-open-alt'}"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function openEditModal(userId) {
    currentEditUserId = userId;
    const modal = document.getElementById('edit-user-modal');
    modal.style.display = 'block';
    
    const userRef = ref(db, `users/${userId}`);
    get(userRef).then((snapshot) => {
        const user = snapshot.val();
        document.getElementById('username').value = user.username;
        document.getElementById('role').value = user.role;
        document.getElementById('status').value = user.status || 'active';
    });
}


function translateRole(role) {
    const roles = {
        '0': 'مستخدم عادي',
        '1': 'مدير',
        '2': 'ناشر',
        '3': 'مساعد',
    };
    return roles[role] || role;
}


async function initializeWords() {
    try {
        const response = await fetch('http://192.168.53.174:3000/banned-words/all');
        const words = await response.json();
        displayForbiddenWords(words.bannedWords);
    } catch (error) {
        console.error('Error fetching forbidden words:', error);
        messageToast('حدث خطأ في تحميل الكلمات الممنوعة');
    }
}

function displayForbiddenWords(words) {
    const wordsContainer = document.getElementById('forbidden-words-list');
    wordsContainer.innerHTML = words.map(word => `
        
        <div class="word-item">
            <h3>${word.word}</h3>
            <div class="actions">
                <button onclick="editWord('${word.id}')">تعديل</button>
                <button onclick="deleteWord('${word.id}')">حذف</button>
            </div>
        </div>
    `).join('');
}
async function deleteWord(word) {
    if (confirm('هل أنت متأكد من حذف هذه الكلمة؟')) {
        try {
            const token = localStorage.getItem('token');
            console.log(token);
            

            if (!token) {
                messageToast('التوكن غير موجود. يرجى تسجيل الدخول مرة أخرى.');
                return;
            }
            const response = await fetch(`http://192.168.53.174:3000/banned-words/delete/${word}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });
            

            if (response.ok) {
                const data = await response.json(); 
                const message = data.message || 'تم حذف الكلمة بنجاح';
                messageToast(message);
                initializeWords();
            } else {
                const errorData = await response.json();
                const errorMessage = errorData.message || 'حدث خطأ أثناء حذف الكلمة';
                messageToast(errorMessage);
            }
        } catch (error) {
            console.error('Error deleting word:', error);
            messageToast('حدث خطأ أثناء حذف الكلمة');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadPage('seasons');
});
