import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// 1. Firebase 설정 (사용자 제공 정보)
const firebaseConfig = {
  apiKey: "AIzaSyBtU34dlEnhNb-Uy_6ABZJGEsf29Z_DV-8",
  authDomain: "wvl-2-f7daf.firebaseapp.com",
  projectId: "wvl-2-f7daf",
  storageBucket: "wvl-2-f7daf.firebasestorage.app",
  messagingSenderId: "394913088009",
  appId: "1:394913088009:web:c91fca2a537cbe79ddeed8",
  measurementId: "G-8754B4MZ2X"
};

// 2. 앱 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 3. 상품 데이터
const products = [
    { id: 1, name: "Luxury Handmade Coat", price: 180000, img: "coat.jpg", desc: 'A luxurious, handcrafted coat designed for elegance and warmth.' },
    { id: 2, name: "Relaxed Chinos", price: 79000, img: "placeholder.jpg", desc: 'Comfortable and stylish chinos perfect for a relaxed yet refined look.' },
    { id: 3, name: "Flow Knit Polo", price: 95000, img: "placeholder.jpg", desc: 'A breathable knit polo that combines classic style with modern comfort.' },
    { id: 4, name: "Modern Oxford Shirt", price: 110000, img: "placeholder.jpg", desc: 'A crisp oxford shirt with a modern cut, suitable for any occasion.' }
];

// 4. 메인 로직 실행
document.addEventListener('DOMContentLoaded', () => {
    // 상품 리스트 렌더링 (메인 페이지인 경우)
    const productGrid = document.querySelector('.product-grid'); // Changed from #product-list
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

    // 장바구니 배지 업데이트
    updateCartCount();

    // --- 로그인/회원가입 로직 ---
    const loginModal = document.getElementById('login-modal');
    const loginBtn = document.getElementById('login-btn'); // 헤더의 Login 버튼
    const submitBtn = document.querySelector('#login-modal button[type="submit"]'); // 모달 안의 로그인/가입 버튼
    const emailInput = document.querySelector('#login-modal input[type="email"]');
    const pwInput = document.querySelector('#login-modal input[type="password"]');
    const nameInput = document.getElementById('signup-name');
    const modalTitle = document.querySelector('#login-modal h2');
    const switchTextContainer = document.querySelector('.switch-text'); // Container for switch text
    
    let isSignup = false; // 현재 회원가입 모드인지 여부

    // Function to handle toggling between login/signup modes
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
        // Re-attach event listener to the new span element
        document.getElementById('toggle-auth').addEventListener('click', handleToggleAuthClick);
    };

    // Initial attachment of event listener to toggle-auth
    if (document.getElementById('toggle-auth')) {
        document.getElementById('toggle-auth').addEventListener('click', handleToggleAuthClick);
    }


    // 헤더 버튼 클릭 (로그인 열기 or 로그아웃)
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            if (auth.currentUser) {
                // 로그인 상태면 로그아웃 실행
                signOut(auth).then(() => {
                    alert("로그아웃 되었습니다.");
                    window.location.reload();
                }).catch((error) => alert("로그아웃 에러: " + error.message));
            } else {
                // 로그아웃 상태면 모달 열기
                loginModal.showModal();
                // Reset to login mode when modal opens
                if (isSignup) { // If it was in signup mode, switch back to login
                  isSignup = true; // Set to true so handleToggleAuthClick will switch it to false (login mode)
                  handleToggleAuthClick();
                }
            }
        });
    }

    // 모달 닫기 버튼
    const closeModalBtn = document.querySelector('.close-modal-btn');
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', () => {
        loginModal.close();
      });
    }

    // 모달 외부 클릭 시 닫기
    if (loginModal) {
      loginModal.addEventListener('click', (event) => {
        if (event.target === loginModal) {
          loginModal.close();
        }
      });
    }


    // 로그인/회원가입 버튼 클릭 시
    if (submitBtn) {
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault(); // 폼 전송 막기
            const email = emailInput.value;
            const password = pwInput.value;

            if (isSignup) {
                createUserWithEmailAndPassword(auth, email, password)
                    .then(() => {
                        alert("회원가입 성공! 환영합니다.");
                        loginModal.close();
                    })
                    .catch((error) => alert("회원가입 에러: " + error.message));
            } else {
                signInWithEmailAndPassword(auth, email, password)
                    .then(() => {
                        alert("로그인 성공!");
                        loginModal.close();
                    })
                    .catch((error) => alert("로그인 실패: " + error.message));
            }
        });
    }

    // --- Product Detail Page Logic ---
    const productDetailPageContainer = document.querySelector('.product-container');
    if (productDetailPageContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = parseInt(urlParams.get('id'));
        const product = products.find(p => p.id === productId);

        const loadingMessage = document.getElementById('loading-message');
        const productContent = document.getElementById('product-content');

        if (product) {
            // Populate the elements
            document.title = `Waveless - ${product.name}`;
            document.getElementById('product-image').src = product.img || 'placeholder.jpg';
            document.getElementById('product-image').alt = product.name;
            document.getElementById('product-name').textContent = product.name;
            document.getElementById('product-price').textContent = `₩${product.price.toLocaleString()}`;
            document.getElementById('product-desc').textContent = product.desc;
            
            // Show content, hide loading message
            loadingMessage.style.display = 'none';
            productContent.style.display = 'flex'; // Use flex to match the new CSS

            const addToCartBtn = document.getElementById('add-to-cart-btn');
            addToCartBtn.dataset.id = product.id; // Set product id on the button
            
            addToCartBtn.addEventListener('click', () => {
                const productIdToAdd = parseInt(addToCartBtn.dataset.id);
                const cart = getCart();
                
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

    // --- Cart Page Logic ---
    const cartPage = document.querySelector('.cart-container');
    if (cartPage) {
        const cart = getCart();
        const cartList = document.getElementById('cart-list');
        const cartSummary = document.getElementById('cart-summary');
        
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

            // Add event listeners for remove buttons
            const removeButtons = document.querySelectorAll('.remove-item-btn');
            removeButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const cartItem = e.target.closest('.cart-item');
                    const productId = parseInt(cartItem.dataset.id);
                    
                    let currentCart = getCart();
                    currentCart = currentCart.filter(id => id !== productId);
                    saveCart(currentCart);
                    
                    // Re-render cart
                    window.location.reload(); 
                });
            });

        } else {
            cartList.innerHTML = '<p>장바구니가 비어 있습니다.</p>';
            cartSummary.innerHTML = '';
        }
    }

});

// 5. 로그인 상태 감지 (실시간)
onAuthStateChanged(auth, (user) => {
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        if (user) {
            loginBtn.innerText = "Logout"; // 로그인 상태면 Logout으로 표시
        } else {
            loginBtn.innerText = "Login";  // 아니면 Login으로 표시
        }
    }
});

// 6. 장바구니 개수 함수
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || []; // Changed key to 'cart'
    const badge = document.querySelector('.badge');
    if (badge) {
        badge.innerText = cart.length;
        badge.style.display = cart.length > 0 ? 'flex' : 'none';
    }
}

function getCart() { // Added missing function from previous main.js
    return JSON.parse(localStorage.getItem('cart')) || [];
}

function saveCart(cart) { // Added missing function from previous main.js
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}
