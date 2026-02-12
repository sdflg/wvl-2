document.addEventListener('DOMContentLoaded', () => {

  // 1. Product Data
  const products = [
    {
      id: 1,
      name: 'Minimalist Tee',
      price: 55000,
      img: 'placeholder.jpg',
      desc: 'A comfortable and stylish tee made from 100% premium cotton. Perfect for any occasion.'
    },
    {
      id: 2,
      name: 'Modern Slacks',
      price: 125000,
      img: 'placeholder.jpg',
      desc: 'Sleek and modern slacks that offer both comfort and a sharp look. Versatile for office or casual wear.'
    },
    {
      id: 3,
      name: 'Classic Watch',
      price: 275000,
      img: 'placeholder.jpg',
      desc: 'An elegant timepiece with a timeless design. Features a stainless steel case and a leather strap.'
    },
    {
      id: 4,
      name: 'Leather Sneakers',
      price: 180000,
      img: 'placeholder.jpg',
      desc: 'Handcrafted leather sneakers that blend luxury with casual style. Built for everyday comfort.'
    }
  ];

  // 2. Core Functions
  function getCart() {
    return JSON.parse(localStorage.getItem('wavelessCart')) || [];
  }

  function saveCart(cart) {
    localStorage.setItem('wavelessCart', JSON.stringify(cart));
    updateCartCount();
  }

  function updateCartCount() {
    const cart = getCart();
    const badge = document.querySelector('.badge');
    if (badge) {
      badge.textContent = cart.length;
    }
  }

  // Initial cart count update on every page load
  updateCartCount();

  // 3. Page-specific Logic
  const productListPage = document.getElementById('product-list');
  const productDetailPage = document.querySelector('.product-detail-container');
  const cartPage = document.querySelector('.cart-container');
  
  // --- Index Page Logic ---
  if (productListPage) {
    const productGrid = products.map(product => `
          <a href="product-detail.html?id=${product.id}" class="product-card">
            <div class="product-image-wrapper">
              <img src="${product.img}" alt="${product.name}">
            </div>        <div class="product-info">
          <h3>${product.name}</h3>
          <p>${product.price.toLocaleString()}원</p>
        </div>
      </a>
    `).join('');
    productListPage.innerHTML = productGrid;
  }

  // --- Product Detail Page Logic ---
  if (productDetailPage) {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    const product = products.find(p => p.id === productId);

    if (product) {
      document.title = `Waveless - ${product.name}`;
      productDetailPage.innerHTML = `
        <div class="product-detail-image">
          <img src="${product.img}" alt="${product.name}">
        </div>
        <div class="product-detail-info">
          <h1>${product.name}</h1>
          <p class="product-price">${product.price.toLocaleString()}원</p>
          <p class="product-desc">${product.desc}</p>
          <button class="add-to-cart-btn" data-id="${product.id}">장바구니 담기</button>
        </div>
      `;

      const addToCartBtn = document.querySelector('.add-to-cart-btn');
      addToCartBtn.addEventListener('click', () => {
        const productId = parseInt(addToCartBtn.dataset.id);
        const cart = getCart();
        
        // Prevent adding duplicates
        if (!cart.includes(productId)) {
          cart.push(productId);
          saveCart(cart);
          alert('상품을 장바구니에 담았습니다.');
        } else {
          alert('이미 장바구니에 있는 상품입니다.');
        }
      });
    } else {
       productDetailPage.innerHTML = '<p>상품을 찾을 수 없습니다.</p>';
    }
  }

  // --- Cart Page Logic ---
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
                <p>${product.price.toLocaleString()}원</p>
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
        <p class="total-price">총 금액: ${total.toLocaleString()}원</p>
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
  
  // --- Login Modal Logic ---
  const loginModal = document.getElementById('login-modal');
  const loginBtn = document.getElementById('login-btn');
  const closeModalBtn = document.querySelector('.close-modal-btn');

  if (loginModal && loginBtn && closeModalBtn) {
    loginBtn.addEventListener('click', () => {
      loginModal.showModal();
    });

    closeModalBtn.addEventListener('click', () => {
      loginModal.close();
    });

    // Close modal if clicked outside
    loginModal.addEventListener('click', (event) => {
      if (event.target === loginModal) {
        loginModal.close();
      }
    });
  }
});