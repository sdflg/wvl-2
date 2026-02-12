import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// 1. Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyBtU34dlEnhNb-Uy_6ABZJGEsf29Z_DV-8",
  authDomain: "wvl-2-f7daf.firebaseapp.com",
  projectId: "wvl-2-f7daf",
  storageBucket: "wvl-2-f7daf.firebasestorage.app",
  messagingSenderId: "394913088009",
  appId: "1:394913088009:web:c91fca2a537cbe79ddeed8",
  measurementId: "G-8754B4MZ2X",
  databaseURL: "https://wvl-2-f7daf-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// 2. 앱 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// 3. 상품 데이터
const products = [
    { id: 1, name: "Luxury Handmade Coat", price: 180000, img: "images/lhc gmn.png", desc: 'A luxurious, handcrafted coat designed for elegance and warmth.' },
    { id: 2, name: "Relaxed Chinos", price: 79000, img: "placeholder.jpg", desc: 'Comfortable and stylish chinos perfect for a relaxed yet refined look.' },
    { id: 3, name: "Flow Knit Polo", price: 95000, img: "placeholder.jpg", desc: 'A breathable knit polo that combines classic style with modern comfort.' },
    { id: 4, name: "Modern Oxford Shirt", price: 110000, img: "placeholder.jpg", desc: 'A crisp oxford shirt with a modern cut, suitable for any occasion.' }
];

let currentCart = []; // 전역 장바구니 상태

// 4. 메인 로직 실행
document.addEventListener('DOMContentLoaded', () => {
    // 상품 리스트 렌더링
    const productGrid = document.querySelector('.product-grid');
    if (productGrid) {
        productGrid.innerHTML = products.map(p => `
            <a href="product-detail.html?id=${p.id}" class="product-card">
                <div class="product-image-wrapper">
                    ${p.img ? `<img src="${p.img}" alt="${p.name}">` : `<span>${p.name}</span>`}
                </div>
                <div class="product-info">
                    <h3>${p.name}</h3>
                    <p>₩${p.price.toLocaleString()}</p>
                </div>
            </a>
        `).join('');
    }

    // 로그인/회원가입 로직
    const loginModal = document.getElementById('login-modal');
    const loginBtn = document.getElementById('login-btn'); 
    const submitBtn = document.querySelector('#login-modal button[type="submit"]');
    const emailInput = document.querySelector('#login-modal input[type="email"]');
    const pwInput = document.querySelector('#login-modal input[type="password"]');
    const nameInput = document.getElementById('signup-name');
    const modalTitle = document.querySelector('#login-modal h2');
    const switchTextContainer = document.querySelector('.switch-text');
    
    let isSignup = false;

    const handleToggleAuthClick = () => {
        isSignup = !isSignup;
        if (isSignup) {
            modalTitle.innerText = "Sign Up";
            submitBtn.innerText = "Create Account";
            nameInput.style.display = "block";
            switchTextContainer.innerHTML = `Already have an account? <span id="toggle-auth" style="cursor:pointer; font-weight:bold; text-decoration:underline;">Log In</span>`;
        } else {
            modalTitle.innerText = "Login";
            submitBtn.innerText = "Log In";
            nameInput.style.display = "none";
            switchTextContainer.innerHTML = `Don't have an account? <span id="toggle-auth" style="cursor:pointer; font-weight:bold; text-decoration:underline;">Sign Up</span>`;
        }
        document.getElementById('toggle-auth').addEventListener('click', handleToggleAuthClick);
    };

    if (document.getElementById('toggle-auth')) {
        document.getElementById('toggle-auth').addEventListener('click', handleToggleAuthClick);
    }

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            if (auth.currentUser) {
                signOut(auth).catch((error) => alert(getFirebaseErrorMessage(error.code)));
            } else {
                loginModal.showModal();
            }
        });
    }

    const closeModalBtn = document.querySelector('.close-modal-btn');
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', () => loginModal.close());
    }

    if (loginModal) {
      loginModal.addEventListener('click', (event) => {
        if (event.target === loginModal) loginModal.close();
      });
    }

    if (submitBtn) {
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const email = emailInput.value;
            const password = pwInput.value;
            const name = nameInput.value;

            if (isSignup) {
                 if (name.trim() === '') {
                    alert('이름을 입력해주세요.');
                    return;
                }
                createUserWithEmailAndPassword(auth, email, password)
                    .then((userCredential) => {
                        updateProfile(userCredential.user, { displayName: name })
                            .then(() => {
                                alert(`${name}님, 환영합니다!`);
                                loginModal.close();
                            });
                    })
                    .catch((error) => alert(getFirebaseErrorMessage(error.code)));
            } else {
                signInWithEmailAndPassword(auth, email, password)
                    .then(() => {
                        alert("로그인 성공!");
                        loginModal.close();
                    })
                    .catch((error) => alert(getFirebaseErrorMessage(error.code)));
            }
        });
    }

    // Cart 버튼 클릭 로직
    const cartLink = document.querySelector('.cart-link');
    if (cartLink) {
        cartLink.addEventListener('click', (e) => {
            if (!auth.currentUser) {
                e.preventDefault();
                loginModal.showModal();
            }
        });
    }

    // 상세 페이지 로직
    const productDetailPageContainer = document.querySelector('.product-container');
    if (productDetailPageContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = parseInt(urlParams.get('id'));
        const product = products.find(p => p.id === productId);

        const loadingMessage = document.getElementById('loading-message');
        const productContent = document.getElementById('product-content');

        if (product) {
            document.title = `Waveless - ${product.name}`;
            document.getElementById('product-image').src = product.img || 'placeholder.jpg';
            document.getElementById('product-image').alt = product.name;
            document.getElementById('product-name').textContent = product.name;
            document.getElementById('product-price').textContent = `₩${product.price.toLocaleString()}`;
            document.getElementById('product-desc').textContent = product.desc;
            
            loadingMessage.style.display = 'none';
            productContent.style.display = 'flex';

            const addToCartBtn = document.getElementById('add-to-cart-btn');
            addToCartBtn.dataset.id = product.id;
            
            addToCartBtn.addEventListener('click', (e) => {
                if (!auth.currentUser) {
                    e.preventDefault();
                    loginModal.showModal();
                    return;
                }
                const productIdToAdd = parseInt(addToCartBtn.dataset.id);
                let cart = getCart();
                
                if (!cart.includes(productIdToAdd)) {
                    cart.push(productIdToAdd);
                    saveCart(cart);
                    alert('상품을 장바구니에 담았습니다.');
                } else {
                    alert('이미 장바구니에 있는 상품입니다.');
                }
            });
        } else {
            loadingMessage.textContent = '상품을 찾을 수 없습니다.';
        }
    }

    // 장바구니 페이지 로직
    const cartPage = document.querySelector('.cart-container');
    if (cartPage) {
        renderCartPage();
    }
});

// 5. 로그인 상태 감지 (실시간)
onAuthStateChanged(auth, (user) => {
    const loginBtn = document.getElementById('login-btn');
    const userNameDisplay = document.getElementById('user-name-display');

    if (user) {
        // 유저 로그인 상태
        loginBtn.innerText = "Logout";
        if (userNameDisplay && user.displayName) {
            userNameDisplay.textContent = `${user.displayName}님, 반가워요!`;
            userNameDisplay.style.display = 'inline';
        } else if (userNameDisplay) {
            userNameDisplay.style.display = 'none';
        }

        const cartRef = ref(db, 'users/' + user.uid + '/cart');
        onValue(cartRef, (snapshot) => {
            currentCart = snapshot.val() || [];
            updateCartCount();
            if (document.querySelector('.cart-container')) renderCartPage();
        });
    } else {
        // 유저 로그아웃 상태
        loginBtn.innerText = "Login";
        if (userNameDisplay) {
            userNameDisplay.style.display = 'none';
            userNameDisplay.textContent = '';
        }

        currentCart = [];
        localStorage.removeItem('cart');
        updateCartCount();
        if (document.querySelector('.cart-container')) renderCartPage();
    }
});

// 6. 장바구니 관련 함수
function updateCartCount() {
    const badge = document.querySelector('.badge');
    if (badge) {
        badge.innerText = currentCart.length;
        badge.style.display = currentCart.length > 0 ? 'flex' : 'none';
    }
}

function getCart() {
    return currentCart;
}

function saveCart(newCart) {
    currentCart = newCart;
    const user = auth.currentUser;
    if (user) {
        set(ref(db, 'users/' + user.uid + '/cart'), currentCart);
    } else {
        localStorage.setItem('cart', JSON.stringify(currentCart));
    }
    updateCartCount();
}

function renderCartPage() {
    const cartList = document.getElementById('cart-list');
    const cartSummary = document.getElementById('cart-summary');
    const cart = getCart();

    if (cart.length > 0) {
        let total = 0;
        const cartItemsHtml = cart.map(productId => {
            const product = products.find(p => p.id === productId);
            if (product) {
                total += product.price;
                return `
                    <div class="cart-item" data-id="${product.id}">
                        <img src="${product.img}" alt="${product.name}" class="cart-item-img">
                        <div class="cart-item-info">
                            <h3>${product.name}</h3>
                            <p>₩${product.price.toLocaleString()}</p>
                        </div>
                        <div class="cart-item-actions">
                            <button class="remove-item-btn">삭제</button>
                        </div>
                    </div>
                `;
            }
            return '';
        }).join('');
        
        cartList.innerHTML = cartItemsHtml;
        cartSummary.innerHTML = `
            <p class="total-price">총 금액: ₩${total.toLocaleString()}</p>
            <button class="checkout-btn">주문하기</button>
        `;

        const removeButtons = document.querySelectorAll('.remove-item-btn');
        removeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const cartItem = e.target.closest('.cart-item');
                const productId = parseInt(cartItem.dataset.id);
                let updatedCart = getCart().filter(id => id !== productId);
                saveCart(updatedCart);
            });
        });

    } else {
        cartList.innerHTML = '<p>장바구니가 비어 있습니다.</p>';
        cartSummary.innerHTML = '';
    }
}

// Firebase 에러 메시지 번역 함수
function getFirebaseErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/invalid-email':
            return "유효하지 않은 이메일 형식입니다.";
        case 'auth/user-not-found':
            return "존재하지 않는 계정입니다.";
        case 'auth/wrong-password':
            return "비밀번호가 틀렸습니다.";
        case 'auth/email-already-in-use':
            return "이미 사용 중인 이메일입니다.";
        case 'auth/weak-password':
            return "비밀번호를 6자리 이상 입력해주세요.";
        case 'auth/network-request-failed':
            return "네트워크 연결이 원활하지 않습니다.";
        default:
            return `로그인/회원가입에 실패했습니다. 다시 시도해주세요. (${errorCode})`;
    }
}