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
    { 
        id: 1, 
        name: "Luxury Handmade Coat", 
        price: 180000, 
        img: "images/lhc gmn.png", 
        desc: "장인 정신으로 한 땀 한 땀 완성한 핸드메이드 코트입니다. 최고급 울 블렌드 소재를 사용하여 가벼우면서도 압도적인 보온성을 자랑합니다. 미니멀한 실루엣에 하이넥 지퍼 디테일로 포인트를 주어 세련된 무드를 연출합니다.",
        extraImages: ['images/lhc gmn.png', 'images/lhcbgmn.png'] 
    },
    { id: 2, name: "Relaxed Chinos", price: 79000, img: "placeholder.jpg", desc: 'Comfortable and stylish chinos perfect for a relaxed yet refined look.' },
    { id: 3, name: "Flow Knit Polo", price: 95000, img: "placeholder.jpg", desc: 'A breathable knit polo that combines classic style with modern comfort.' },
    { id: 4, name: "Modern Oxford Shirt", price: 110000, img: "placeholder.jpg", desc: 'A crisp oxford shirt with a modern cut, suitable for any occasion.' }
];

let currentCart = []; // 전역 장바구니 상태: { productId, size, quantity } 객체 배열
let pendingAddToCart = null; // 로그인 후 장바구니에 담을 상품 정보 { productId, name, price, img, size, quantity }

// 4. 메인 로직 실행
document.addEventListener('DOMContentLoaded', () => {
    // 상품 리스트 렌더링 (index.html)
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

    // 로그인/회원가입 모달 로직
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
      closeModalBtn.addEventListener('click', () => {
        loginModal.close();
        pendingAddToCart = null; // 모달 닫으면 보류된 액션 취소
      });
    }

    if (loginModal) {
      loginModal.addEventListener('click', (event) => {
        if (event.target === loginModal) {
            loginModal.close();
            pendingAddToCart = null; // 모달 닫으면 보류된 액션 취소
        }
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

    // Cart 버튼 클릭 로직 (헤더)
    const cartLink = document.querySelector('.cart-link');
    if (cartLink) {
        cartLink.addEventListener('click', (e) => {
            if (!auth.currentUser) {
                e.preventDefault();
                loginModal.showModal();
            }
        });
    }

    // 상세 페이지 로직 (product-detail.html)
    const productDetailPageContainer = document.querySelector('.product-container');
    if (productDetailPageContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = parseInt(urlParams.get('id'));
        const product = products.find(p => p.id === productId);

        const loadingMessage = document.getElementById('loading-message');
        const productContent = document.getElementById('product-content');
        const productSizeSelect = document.getElementById('product-size'); 

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
            
            // 장바구니 담기 버튼 이벤트 리스너
            addToCartBtn.addEventListener('click', (e) => {
                e.preventDefault(); // 기본 동작 방지

                const selectedSize = productSizeSelect ? productSizeSelect.value : 'S'; // 선택된 사이즈 가져오기
                // itemToAdd에 필요한 모든 상품 정보 포함
                const itemToAdd = { 
                    productId: product.id, 
                    name: product.name, 
                    price: product.price, 
                    img: product.img, 
                    size: selectedSize, 
                    quantity: 1 
                };

                if (!auth.currentUser) {
                    pendingAddToCart = itemToAdd; // 보류된 액션 저장
                    loginModal.showModal();
                    return;
                }
                
                addItemToCart(itemToAdd, true); // 로그인 상태이면 바로 알림 표시
            });

            // Populate and display detail view section if product has extraImages
            const detailViewSection = document.getElementById('detail-view-section');
            const productLongDesc = document.getElementById('product-long-desc');
            const extraImagesContainer = document.getElementById('extra-images-container');

            if (product.extraImages && productLongDesc && extraImagesContainer && detailViewSection) {
                productLongDesc.textContent = product.desc; // Use the detailed description
                extraImagesContainer.innerHTML = ''; // Clear previous images
                product.extraImages.forEach(imagePath => {
                    const imgElement = document.createElement('img');
                    imgElement.src = imagePath;
                    imgElement.alt = product.name + ' detail';
                    imgElement.classList.add('detail-view-image'); // Add class for styling
                    extraImagesContainer.appendChild(imgElement);
                });
                detailViewSection.style.display = 'block'; // Make the section visible
            }
        } else {
            loadingMessage.textContent = '상품을 찾을 수 없습니다.';
        }
    }

    // 장바구니 페이지 로직 (cart.html)
    const cartPage = document.querySelector('.cart-container');
    if (cartPage) {
        renderCartPage(); // 최초 렌더링

        // 이벤트 위임 (quantity, size, remove 버튼)
        cartPage.addEventListener('click', (e) => {
            const target = e.target;
            // dataset에서 productId와 size를 파싱
            const cartItemElement = target.closest('.cart-item');
            if (!cartItemElement) return;

            const productId = parseInt(cartItemElement.dataset.productId);
            const size = cartItemElement.dataset.size;

            if (target.classList.contains('increase-quantity')) {
                increaseQuantity(productId, size);
            } else if (target.classList.contains('decrease-quantity')) {
                decreaseQuantity(productId, size);
            } else if (target.classList.contains('remove-item-btn')) {
                removeItemFromCart(productId, size);
            }
        });

        cartPage.addEventListener('change', (e) => {
            const target = e.target;
            if (target.tagName === 'SELECT' && target.classList.contains('cart-item-size-select')) {
                const productId = parseInt(target.dataset.productId);
                const oldSize = target.dataset.oldSize; // 기존 사이즈
                const newSize = target.value; // 새로 선택된 사이즈
                changeItemSize(productId, oldSize, newSize);
            }
        });
    }
    updateCartBadge(); // DOMContentLoaded 시 배지 초기화
});

// 상품을 장바구니에 추가하는 실제 로직 함수
function addItemToCart(item, showAlerts = false) { // item: { productId, name, price, img, size, quantity }
    let cart = getCart();
    
    // 이미 같은 상품+사이즈 조합이 있는지 확인
    const existingItem = cart.find(cartItem => cartItem.productId === item.productId && cartItem.size === item.size);

    if (existingItem) {
        existingItem.quantity += item.quantity; // 수량 증가
        if (showAlerts) alert(`'${item.name}' (${item.size}) ${item.quantity}개 추가: 현재 수량 ${existingItem.quantity}개`);
    } else {
        cart.push(item);
        if (showAlerts) alert(`'${item.name}' (${item.size})이(가) 장바구니에 담겼습니다!`);
    }
    saveCart(cart);

    // 장바구니로 이동할지 확인 (showAlerts가 true일 때만)
    if (showAlerts && confirm("장바구니로 이동하시겠습니까?")) {
        window.location.href = 'cart.html';
    }
}

// 장바구니 수량 증가
function increaseQuantity(productId, size) {
    let cart = getCart();
    const item = cart.find(cartItem => cartItem.productId === productId && cartItem.size === size);
    if (item) {
        item.quantity++;
        saveCart(cart);
        renderCartPage();
    }
}

// 장바구니 수량 감소
function decreaseQuantity(productId, size) {
    let cart = getCart();
    const item = cart.find(cartItem => cartItem.productId === productId && cartItem.size === size);
    if (item && item.quantity > 1) {
        item.quantity--;
        saveCart(cart);
        renderCartPage();
    } else if (item && item.quantity === 1) {
        alert('최소 수량은 1개입니다. 상품을 삭제하려면 삭제 버튼을 이용해주세요.');
    }
}

// 장바구니에서 상품 삭제
function removeItemFromCart(productId, size) {
    let cart = getCart();
    const updatedCart = cart.filter(item => !(item.productId === productId && item.size === size));
    saveCart(updatedCart);
    renderCartPage(); // 삭제 후 장바구니 리렌더링
}

// 장바구니 상품 사이즈 변경
function changeItemSize(productId, oldSize, newSize) {
    if (oldSize === newSize) return; // 사이즈 변경 없음

    let cart = getCart();
    const oldItemIndex = cart.findIndex(item => item.productId === productId && item.size === oldSize);

    if (oldItemIndex > -1) {
        const itemToMove = { ...cart[oldItemIndex] }; // 기존 아이템 정보 복사
        itemToMove.size = newSize; // 새 사이즈 적용
        
        cart.splice(oldItemIndex, 1); // 기존 아이템 삭제

        const existingNewSizeItem = cart.find(item => item.productId === productId && item.size === newSize);
        if (existingNewSizeItem) {
            existingNewSizeItem.quantity += itemToMove.quantity; // 수량 병합
            alert(`'${products.find(p=>p.id===productId).name}' 상품의 사이즈를 변경하고 기존 '${newSize}' 사이즈 상품에 수량을 합쳤습니다.`);
        } else {
            cart.push(itemToMove); // 새 사이즈로 추가
            alert(`'${products.find(p=>p.id===productId).name}' 상품의 사이즈를 '${oldSize}'에서 '${newSize}'(으)로 변경했습니다.`);
        }
        saveCart(cart);
        renderCartPage();
    }
}


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
            updateCartBadge(); // 배지 업데이트
            if (document.querySelector('.cart-container')) renderCartPage(); // 장바구니 페이지인 경우 리렌더링

            // 로그인 후 보류된 장바구니 액션 실행
            if (pendingAddToCart) {
                const tempPending = pendingAddToCart; // 임시 저장
                pendingAddToCart = null; // 즉시 초기화하여 무한 루프 방지
                addItemToCart(tempPending, true); // 로그인 후 알림 표시
            }
        });
    } else {
        // 유저 로그아웃 상태
        loginBtn.innerText = "Login";
        if (userNameDisplay) {
            userNameDisplay.style.display = 'none';
            userNameDisplay.textContent = '';
        }

        currentCart = JSON.parse(localStorage.getItem('cart')) || []; // 로컬 스토리지에서 불러옴
        updateCartBadge(); // 배지 업데이트
        if (document.querySelector('.cart-container')) renderCartPage(); // 장바구니 페이지인 경우 리렌더링
        pendingAddToCart = null; // 로그아웃 시 보류된 액션 초기화
    }
});

// 6. 장바구니 관련 함수
function updateCartBadge() {
    const badge = document.querySelector('.badge');
    if (badge) {
        const totalItems = currentCart.reduce((sum, item) => sum + item.quantity, 0);
        badge.innerText = totalItems;
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
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
    updateCartBadge(); // 배지 업데이트
}

function renderCartPage() {
    const cartList = document.getElementById('cart-list');
    const cartSummary = document.getElementById('cart-summary');
    const cart = getCart();
    const availableSizes = ['S', 'M', 'L'];

    if (cart.length > 0) {
        let total = 0;
        const cartItemsHtml = cart.map(item => { // item은 { productId, size, quantity } 객체
            const product = products.find(p => p.id === item.productId);
            if (product) {
                const itemTotalPrice = product.price * item.quantity;
                total += itemTotalPrice;
                return `
                    <div class="cart-item" data-product-id="${item.productId}" data-size="${item.size}">
                        <img src="${product.img}" alt="${product.name}" class="cart-item-img">
                        <div class="cart-item-info">
                            <h3>${product.name}</h3>
                            <p>가격: ₩${product.price.toLocaleString()}</p>
                            <p class="item-subtotal">소계: ₩${itemTotalPrice.toLocaleString()}</p>
                            <div class="size-selector-cart">
                                <label for="size-select-${item.productId}-${item.size}">사이즈:</label>
                                <select id="size-select-${item.productId}-${item.size}" 
                                        class="cart-item-size-select"
                                        data-product-id="${item.productId}" 
                                        data-old-size="${item.size}">
                                    ${availableSizes.map(s => `<option value="${s}" ${s === item.size ? 'selected' : ''}>${s}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        <div class="cart-item-actions">
                            <div class="quantity-controls">
                                <button class="quantity-btn decrease-quantity" data-product-id="${item.productId}" data-size="${item.size}">-</button>
                                <span class="item-quantity">${item.quantity}</span>
                                <button class="quantity-btn increase-quantity" data-product-id="${item.productId}" data-size="${item.size}">+</button>
                            </div>
                            <button class="remove-item-btn" data-product-id="${item.productId}" data-size="${item.size}">삭제</button>
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