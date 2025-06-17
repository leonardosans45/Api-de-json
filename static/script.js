// Código para el formulario de creación de usuarios
const userForm = document.getElementById('userForm');
if (userForm) {
    userForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            firstname: document.getElementById('firstname').value,
            lastname: document.getElementById('lastname').value,
            userid: document.getElementById('userid').value,
            password: document.getElementById('password').value,
            birthday: document.getElementById('birthday').value
        };
        
        try {
            const response = await fetch('/create_user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            const messageEl = document.getElementById('message');
            messageEl.textContent = '¡Usuario creado exitosamente!';
            messageEl.className = 'message success';
            userForm.reset();
            
            // Recargar la tabla de usuarios si estamos en la página de usuarios
            if (document.querySelector('.users-page')) {
                loadUsers();
            }
            
            // Ocultar el mensaje después de 5 segundos
            setTimeout(() => {
                messageEl.textContent = '';
                messageEl.className = 'message';
            }, 5000);
            
        } catch (error) {
            console.error('Error:', error);
            const messageEl = document.getElementById('message');
            messageEl.textContent = 'Error al crear el usuario';
            messageEl.className = 'message error';
        }
    });
}

// Código para la tabla de usuarios
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si estamos en la página de usuarios
    if (document.querySelector('.users-page')) {
        // Cargar usuarios al iniciar
        loadUsers();
        
        // Configurar el botón de actualizar
        const refreshBtn = document.getElementById('refresh-users');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', loadUsers);
        }
        
        // Configurar la búsqueda
        const searchInput = document.getElementById('search-users');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(loadUsers, 300);
            });
        }
        
        // Configurar el modal
        const modal = document.getElementById('user-modal');
        const closeModal = document.querySelector('.close-modal');
        
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                modal.classList.remove('show');
            });
        }
        
        // Cerrar modal al hacer clic fuera del contenido
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    }
});

// Función para cargar los usuarios
async function loadUsers() {
    const searchTerm = document.getElementById('search-users')?.value.toLowerCase() || '';
    const tbody = document.getElementById('users-table-body');
    const userCountEl = document.getElementById('user-count');
    
    if (!tbody) return;
    
    try {
        // Mostrar estado de carga
        tbody.innerHTML = `
            <tr class="loading-row">
                <td colspan="6">
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i> Cargando usuarios...
                    </div>
                </td>
            </tr>`;
        
        // Obtener usuarios
        const response = await fetch('/users');
        if (!response.ok) throw new Error('Error al cargar los usuarios');
        
        const data = await response.json();
        let users = data.users || [];
        
        // Filtrar usuarios si hay un término de búsqueda
        if (searchTerm) {
            users = users.filter(user => 
                user.firstname.toLowerCase().includes(searchTerm) ||
                user.lastname.toLowerCase().includes(searchTerm) ||
                user.userid.toLowerCase().includes(searchTerm) ||
                user.id.toString().includes(searchTerm)
            );
        }
        
        // Actualizar contador
        if (userCountEl) {
            userCountEl.textContent = users.length;
        }
        
        // Mostrar mensaje si no hay usuarios
        if (users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <i class="fas fa-user-slash"></i>
                        <p>No se encontraron usuarios</p>
                    </td>
                </tr>`;
            return;
        }
        
        // Generar filas de la tabla
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${escapeHtml(user.firstname || '')}</td>
                <td>${escapeHtml(user.lastname || '')}</td>
                <td>${escapeHtml(user.userid || '')}</td>
                <td>${formatDate(user.birthday)}</td>
                <td class="action-buttons">
                    <button class="btn-icon view-user" data-user='${escapeHtml(JSON.stringify(user))}'>
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon edit-user" data-id="${user.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        // Agregar event listeners a los botones
        document.querySelectorAll('.view-user').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const user = JSON.parse(e.currentTarget.getAttribute('data-user'));
                showUserDetails(user);
            });
        });
        
        document.querySelectorAll('.edit-user').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.currentTarget.getAttribute('data-id');
                // Aquí puedes implementar la lógica para editar
                alert(`Editar usuario con ID: ${userId}`);
            });
        });
        
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    Error al cargar los usuarios. Intente de nuevo más tarde.
                </td>
            </tr>`;
    }
}

// Función para mostrar los detalles del usuario en un modal
function showUserDetails(user) {
    const modal = document.getElementById('user-modal');
    const modalContent = document.getElementById('user-details');
    
    if (!modal || !modalContent) return;
    
    // Formatear la fecha de nacimiento
    const formattedDate = formatDate(user.birthday);
    
    // Crear el contenido del modal
    modalContent.innerHTML = `
        <div class="user-detail">
            <label>ID</label>
            <p>${user.id}</p>
        </div>
        <div class="user-detail">
            <label>Nombre</label>
            <p>${escapeHtml(user.firstname || '')}</p>
        </div>
        <div class="user-detail">
            <label>Apellido</label>
            <p>${escapeHtml(user.lastname || '')}</p>
        </div>
        <div class="user-detail">
            <label>Nombre de Usuario</label>
            <p>${escapeHtml(user.userid || '')}</p>
        </div>
        <div class="user-detail">
            <label>Fecha de Nacimiento</label>
            <p>${formattedDate}</p>
        </div>
    `;
    
    // Mostrar el modal
    modal.classList.add('show');
}

// Función para formatear la fecha
function formatDate(dateString) {
    if (!dateString) return 'No especificada';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString; // Si no es una fecha válida, devolver el string original
        
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (e) {
        return dateString; // En caso de error, devolver el string original
    }
}

// Función para escapar HTML (prevenir XSS)
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return '';
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}