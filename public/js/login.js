document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('formLogin');
    const userInput = document.getElementById('usuario');
    const passInput = document.getElementById('password');
    const btnTogglePass = document.getElementById('btnTogglePass');
    const iconPass = document.getElementById('iconPass');
    const btnSubmit = document.getElementById('btnSubmit');

    // Toggle para ver/ocultar contraseña
    if (btnTogglePass && passInput && iconPass) {
        btnTogglePass.addEventListener('click', () => {
            const isPassword = passInput.type === 'password';
            passInput.type = isPassword ? 'text' : 'password';
            iconPass.className = isPassword ? 'fa-solid fa-unlock text-purple-300' : 'fa-solid fa-lock';
        });
    }

    // Manejo del submit
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();

            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i><span> Validando...</span>';

            const usuario = userInput.value.trim();
            const password = passInput.value.trim();

            try {
                const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ usuario, password })
                });

                const data = await res.json();

                if (res.ok && data.status === 'ok') {
                    window.location.href = '/';
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Acceso Denegado',
                        text: data.mensaje || 'Usuario o contraseña incorrectos',
                        background: '#180e29',
                        color: '#f3e8ff',
                        confirmButtonColor: '#9333ea',
                        customClass: {
                            popup: 'glass-panel rounded-2xl border border-purple-500/30'
                        }
                    });
                }
            } catch (err) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Error de Red',
                    text: 'No se pudo comunicar con el servidor.',
                    background: '#180e29',
                    color: '#f3e8ff',
                    confirmButtonColor: '#9333ea'
                });
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = '<span>Login</span>';
            }
        });
    }
});