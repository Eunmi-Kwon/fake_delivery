// 음식 데이터 구성 (기본 3종 + 추가 카테고리 3종)
const foods = [
    {
        id: 1,
        name: "황금치킨",
        price: 18000,
        image: "assets/images/chicken.png",
        eta: "25~35분",
        category: "치킨"
    },
    {
        id: 2,
        name: "불고기피자",
        price: 23000,
        image: "assets/images/pizza.png",
        eta: "30~40분",
        category: "피자"
    },
    {
        id: 3,
        name: "더블버거",
        price: 12000,
        image: "assets/images/burger.png",
        eta: "20~30분",
        category: "햄버거"
    },
    {
        id: 4,
        name: "명품짜장면",
        price: 10000,
        image: "assets/images/chinese.png",
        eta: "15~25분",
        category: "중식"
    },
    {
        id: 5,
        name: "매콤불족발",
        price: 28000,
        image: "assets/images/jokbal.png",
        eta: "35~45분",
        category: "족발"
    },
    {
        id: 6,
        name: "눈꽃치즈떡볶이",
        price: 14000,
        image: "assets/images/tteokbokki.png",
        eta: "20~30분",
        category: "분식"
    }
];

// 상태 변수
let state = {
    savedMoney: 0,
    successCount: 0,
    totalOrders: 0,
    currentCategory: "전체",
    searchQuery: "",
    cart: [], // 장바구니 항목: { foodId, quantity }
    deliveryTimer: null,
    deliveryElapsed: 0,
    savedHistory: {}, // 일별 참기 금액 데이터 { "YYYY-MM-DD": 금액 }
    calendarYear: new Date().getFullYear(),
    calendarMonth: new Date().getMonth() // 0-indexed
};

// DOM 요소
const elSavedMoney = document.getElementById("savedMoney");
const elSuccessCount = document.getElementById("successCount");
const elFoodList = document.getElementById("foodList");
const elSearchInput = document.getElementById("searchInput");
const elCategoryContainer = document.getElementById("categoryContainer");

// 장바구니 플로팅 바 요소
const elCartFloatingBar = document.getElementById("cartFloatingBar");
const elCartBadgeCount = document.getElementById("cartBadgeCount");
const elCartBarTotalPrice = document.getElementById("cartBarTotalPrice");
const btnViewCart = document.getElementById("btnViewCart");

// 모달 및 스크린 요소
const elConfirmModal = document.getElementById("confirmModal");
const elDeliveryScreen = document.getElementById("deliveryScreen");
const elSuccessModal = document.getElementById("successModal");

// 장바구니 모달 내 상세 요소
const elCartItemList = document.getElementById("cartItemList");
const elCartModalTotalPrice = document.getElementById("cartModalTotalPrice");

// 캘린더 모달 및 상세 요소
const elCalendarModal = document.getElementById("calendarModal");
const elCalendarGrid = document.getElementById("calendarGrid");
const elCalendarTitle = document.getElementById("calendarTitle");
const elStatMonthlySavings = document.getElementById("statMonthlySavings");
const elStatMonthlyCount = document.getElementById("statMonthlyCount");
const elStatMonthlyAverage = document.getElementById("statMonthlyAverage");

// 배달 진행 정보
const elDeliveryTimerVal = document.getElementById("deliveryTimerVal");
const elDeliveryStatusVal = document.getElementById("deliveryStatusVal");
const elRiderCharacter = document.getElementById("riderCharacter");
const elRoadLine = document.getElementById("roadLine");
const timelineSteps = [
    document.getElementById("step1"),
    document.getElementById("step2"),
    document.getElementById("step3"),
    document.getElementById("step4"),
    document.getElementById("step5")
];

// 성공 화면 정보
const elSuccessMoney = document.getElementById("successMoney");

// 보조 함수: 로컬 기준 날짜 문자열 반환 (YYYY-MM-DD)
function getLocalDateString(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const date = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
}

// 이미지 로드 실패 시 대체할 SVG 플레이스홀더 렌더러
function handleImageError(img, category) {
    img.onerror = null;
    const colors = {
        "치킨": ["#FF8C00", "#FF4500"],
        "피자": ["#FFA500", "#D2691E"],
        "햄버거": ["#CD853F", "#8B4513"],
        "중식": ["#FF0000", "#B22222"],
        "족발": ["#8B5A2B", "#5C3A21"],
        "분식": ["#FF6347", "#FF0000"]
    };
    const c = colors[category] || ["#FFA234", "#FF5E36"];
    img.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c[0]}"/><stop offset="100%" stop-color="${c[1]}"/></linearGradient></defs><rect width="100" height="100" fill="url(%23g)"/><text x="50%" y="55%" font-family="system-ui" font-weight="bold" font-size="28" fill="white" text-anchor="middle">${category[0]}</text></svg>`;
}

// 초기 로드 시 LocalStorage 데이터 불러오기
function initApp() {
    state.savedMoney = parseInt(localStorage.getItem("savedMoney")) || 0;
    state.successCount = parseInt(localStorage.getItem("successCount")) || 0;
    state.totalOrders = parseInt(localStorage.getItem("totalOrders")) || 0;

    // 일별 절약 히스토리 데이터 로드 및 하위 호환 마이그레이션
    const historyStr = localStorage.getItem("savedHistory");
    if (historyStr) {
        state.savedHistory = JSON.parse(historyStr);
    } else {
        state.savedHistory = {};
        // 기존에 누적 절약 금액 데이터가 이미 저장되어 있었을 경우, 오늘 날짜로 일괄 이관
        if (state.savedMoney > 0) {
            const todayStr = getLocalDateString(new Date());
            state.savedHistory[todayStr] = state.savedMoney;
            localStorage.setItem("savedHistory", JSON.stringify(state.savedHistory));
        }
    }

    updateDashboard();
    renderCategories();
    renderFoodList();
    updateCartFloatingBar();
}

// 대시보드 UI 업데이트
function updateDashboard() {
    elSavedMoney.textContent = state.savedMoney.toLocaleString();
    elSuccessCount.textContent = `${state.successCount}번`;
}

// 카테고리 탭 렌더링
function renderCategories() {
    const categories = ["전체", "치킨", "피자", "햄버거", "중식", "족발", "분식"];
    elCategoryContainer.innerHTML = "";
    categories.forEach(cat => {
        const btn = document.createElement("button");
        btn.className = `category-tab ${state.currentCategory === cat ? 'active' : ''}`;
        btn.textContent = cat;
        btn.addEventListener("click", () => {
            state.currentCategory = cat;
            document.querySelectorAll(".category-tab").forEach(tab => tab.classList.remove("active"));
            btn.classList.add("active");
            renderFoodList();
        });
        elCategoryContainer.appendChild(btn);
    });
}

// 음식 목록 렌더링
function renderFoodList() {
    // 필터링 적용
    const filtered = foods.filter(food => {
        const matchesCategory = state.currentCategory === "전체" || food.category === state.currentCategory;
        const matchesSearch = food.name.toLowerCase().includes(state.searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    elFoodList.innerHTML = "";

    if (filtered.length === 0) {
        elFoodList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <div class="empty-text">조건에 맞는 음식이 없습니다.</div>
            </div>
        `;
        return;
    }

    filtered.forEach(food => {
        const card = document.createElement("div");
        card.className = "food-card";
        card.innerHTML = `
            <div class="food-img-wrapper">
                <img src="${food.image}" alt="${food.name}" class="food-img" onerror="handleImageError(this, '${food.category}')">
            </div>
            <div class="food-info">
                <div>
                    <h3 class="food-name">${food.name}</h3>
                    <div class="food-meta">
                        <span class="food-eta">⏱️ ${food.eta}</span>
                    </div>
                </div>
                <div class="food-price">${food.price.toLocaleString()}원</div>
            </div>
            <button class="btn-order" data-id="${food.id}">담기</button>
        `;

        // 담기 버튼 클릭 이벤트
        card.querySelector(".btn-order").addEventListener("click", () => {
            addToCart(food.id);
        });

        elFoodList.appendChild(card);
    });
}

// 검색창 필터링
elSearchInput.addEventListener("input", (e) => {
    state.searchQuery = e.target.value.trim();
    renderFoodList();
});

// --- 장바구니 관련 핵심 로직 ---

// 장바구니에 항목 추가
function addToCart(foodId) {
    const existing = state.cart.find(item => item.foodId === foodId);
    if (existing) {
        existing.quantity += 1;
    } else {
        state.cart.push({ foodId, quantity: 1 });
    }
    
    updateCartFloatingBar();
    showToast();
}

// 장바구니 플로팅 바 UI 갱신
function updateCartFloatingBar() {
    const totalQty = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = getCartTotalPrice();

    if (totalQty > 0) {
        elCartBadgeCount.textContent = totalQty;
        elCartBarTotalPrice.textContent = `${totalPrice.toLocaleString()}원`;
        elCartFloatingBar.classList.add("active");
    } else {
        elCartFloatingBar.classList.remove("active");
    }
}

// 담기 성공 시 바운싱 피드백
function showToast() {
    elCartFloatingBar.style.transform = "scale(1.05)";
    setTimeout(() => {
        elCartFloatingBar.style.transform = "translateY(0) scale(1)";
    }, 150);
}

// 장바구니 총액 합산
function getCartTotalPrice() {
    return state.cart.reduce((sum, item) => {
        const food = foods.find(f => f.id === item.foodId);
        return sum + (food ? food.price * item.quantity : 0);
    }, 0);
}

// 장바구니 모달 열기
btnViewCart.addEventListener("click", () => {
    renderCartModal();
    elConfirmModal.classList.add("active");
});

// 장바구니 모달 닫기
function closeCartModal() {
    elConfirmModal.classList.remove("active");
}

document.getElementById("btnCancel").addEventListener("click", closeCartModal);

// 장바구니 수량 가감
function updateCartQuantity(foodId, change) {
    const item = state.cart.find(item => item.foodId === foodId);
    if (!item) return;

    item.quantity += change;
    if (item.quantity <= 0) {
        state.cart = state.cart.filter(i => i.foodId !== foodId);
    }

    renderCartModal();
    updateCartFloatingBar();
}

// 장바구니 개별 삭제
function removeFromCart(foodId) {
    state.cart = state.cart.filter(item => item.foodId !== foodId);
    renderCartModal();
    updateCartFloatingBar();
}

// 장바구니 렌더링
function renderCartModal() {
    elCartItemList.innerHTML = "";
    
    if (state.cart.length === 0) {
        elCartItemList.innerHTML = `
            <div class="empty-state" style="padding: 20px 0;">
                <div class="empty-text">장바구니가 비어 있습니다.</div>
            </div>
        `;
        elCartModalTotalPrice.textContent = "0원";
        setTimeout(() => {
            closeCartModal();
        }, 800);
        return;
    }

    state.cart.forEach(item => {
        const food = foods.find(f => f.id === item.foodId);
        if (!food) return;

        const cartItemDiv = document.createElement("div");
        cartItemDiv.className = "cart-item";
        cartItemDiv.innerHTML = `
            <span class="cart-item-name">${food.name}</span>
            <div class="cart-item-meta">
                <span class="cart-item-price">${(food.price * item.quantity).toLocaleString()}원</span>
                <div class="quantity-controller">
                    <button class="btn-qty btn-minus" data-id="${food.id}">-</button>
                    <span class="qty-val">${item.quantity}</span>
                    <button class="btn-qty btn-plus" data-id="${food.id}">+</button>
                </div>
                <button class="btn-remove" data-id="${food.id}">삭제</button>
            </div>
        `;

        cartItemDiv.querySelector(".btn-minus").addEventListener("click", () => updateCartQuantity(food.id, -1));
        cartItemDiv.querySelector(".btn-plus").addEventListener("click", () => updateCartQuantity(food.id, 1));
        cartItemDiv.querySelector(".btn-remove").addEventListener("click", () => removeFromCart(food.id));

        elCartItemList.appendChild(cartItemDiv);
    });

    const totalPrice = getCartTotalPrice();
    elCartModalTotalPrice.textContent = `${totalPrice.toLocaleString()}원`;
}

// 주문 시작
document.getElementById("btnConfirmOrder").addEventListener("click", () => {
    if (state.cart.length === 0) return;
    closeCartModal();
    startFakeDelivery();
});

// 가짜 배달 시작
function startFakeDelivery() {
    if (state.cart.length === 0) return;

    const firstItem = state.cart[0];
    const firstFood = foods.find(f => f.id === firstItem.foodId);
    const totalTypes = state.cart.length;
    
    let displayName = firstFood ? firstFood.name : "주문 음식";
    if (totalTypes > 1) {
        displayName += ` 외 ${totalTypes - 1}건`;
    }

    elDeliveryScreen.classList.add("active");
    state.deliveryElapsed = 0;
    updateDeliveryUI(0, displayName);

    state.deliveryTimer = setInterval(() => {
        state.deliveryElapsed += 1;
        updateDeliveryUI(state.deliveryElapsed, displayName);

        if (state.deliveryElapsed >= 20) {
            clearInterval(state.deliveryTimer);
            showSuccessModal(displayName);
        }
    }, 1000);
}

// 배달 UI 업데이트
function updateDeliveryUI(seconds, displayName) {
    const totalDuration = 20;
    const percentage = (seconds / totalDuration) * 100;

    elDeliveryTimerVal.textContent = `${totalDuration - seconds}초`;
    elRiderCharacter.style.left = `${percentage}%`;
    elRoadLine.style.width = `${percentage}%`;

    let statusText = `${displayName} 주문 접수 중...`;
    let currentStepIndex = 0;

    if (seconds >= 20) {
        currentStepIndex = 4;
        statusText = "배달이 도착했습니다!";
    } else if (seconds >= 15) {
        currentStepIndex = 3;
        statusText = `${displayName}이(가) 곧 도착합니다!`;
    } else if (seconds >= 10) {
        currentStepIndex = 2;
        statusText = `라이더가 ${displayName} 배달을 시작했습니다!`;
    } else if (seconds >= 5) {
        currentStepIndex = 1;
        statusText = `${displayName} 맛있는 조리 중!`;
    } else {
        currentStepIndex = 0;
        statusText = `${displayName} 주문을 접수하고 있습니다.`;
    }

    elDeliveryStatusVal.textContent = statusText;

    timelineSteps.forEach((step, idx) => {
        step.classList.remove("active", "completed");
        if (idx < currentStepIndex) {
            step.classList.add("completed");
        } else if (idx === currentStepIndex) {
            step.classList.add("active");
        }
    });
}

// 배달 완료 및 성공 정보 팝업
function showSuccessModal(displayName) {
    const cartTotal = getCartTotalPrice();

    // 로컬 데이터 갱신
    state.savedMoney += cartTotal;
    state.successCount += 1;
    state.totalOrders += 1;

    // 캘린더 히스토리에 날짜별 저장
    const todayStr = getLocalDateString(new Date());
    state.savedHistory[todayStr] = (state.savedHistory[todayStr] || 0) + cartTotal;

    // 로컬스토리지 저장
    localStorage.setItem("savedMoney", state.savedMoney);
    localStorage.setItem("successCount", state.successCount);
    localStorage.setItem("totalOrders", state.totalOrders);
    localStorage.setItem("savedHistory", JSON.stringify(state.savedHistory));

    // 즉시 홈 대시보드 갱신
    updateDashboard();

    elSuccessMoney.textContent = `${cartTotal.toLocaleString()}원`;
    elSuccessModal.classList.add("active");
}

// 성공 팝업 -> 홈으로 가기
document.getElementById("btnGoHome").addEventListener("click", () => {
    elSuccessModal.classList.remove("active");
    elDeliveryScreen.classList.remove("active");
    
    state.cart = [];
    updateCartFloatingBar();
    updateDashboard();
});


// --- 절약 캘린더 엔진 로직 ---

// 캘린더 데이터 그리드 빌드
function generateCalendar(year, month) {
    // 헤더 제목 업데이트 (예: 2026년 06월)
    elCalendarTitle.textContent = `${year}년 ${String(month + 1).padStart(2, '0')}월`;
    elCalendarGrid.innerHTML = "";

    // 당월 1일 및 요일 위치 계산
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay(); // 0(일) ~ 6(토)
    
    // 당월 총 날짜 수 계산
    const totalDays = new Date(year, month + 1, 0).getDate();

    // 1일 시작 전 요일 오프셋만큼 빈 칸 삽입
    for (let i = 0; i < startDayOfWeek; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.className = "calendar-day empty";
        elCalendarGrid.appendChild(emptyCell);
    }

    const todayStr = getLocalDateString(new Date());

    // 1일부터 끝자리 일까지 동적 생성
    for (let day = 1; day <= totalDays; day++) {
        const dayCell = document.createElement("div");
        dayCell.className = "calendar-day";

        const currentMonthStr = String(month + 1).padStart(2, '0');
        const currentDayStr = String(day).padStart(2, '0');
        const cellDateStr = `${year}-${currentMonthStr}-${currentDayStr}`;

        // 오늘 하이라이트
        if (cellDateStr === todayStr) {
            dayCell.classList.add("today");
        }

        dayCell.innerHTML = `<span class="day-number">${day}</span>`;

        // 당일 절약 히스토리 내역이 있는지 조회
        const savedAmount = state.savedHistory[cellDateStr];
        if (savedAmount && savedAmount > 0) {
            dayCell.classList.add("saved-day");

            // 가독성 있는 컴팩트한 금액 출력 (예: 1.8만, 2.3만, 5K 등)
            let amountText = "";
            if (savedAmount >= 10000) {
                amountText = `+${(savedAmount / 10000).toFixed(1).replace('.0', '')}만`;
            } else {
                amountText = `+${(savedAmount / 1000).toFixed(1).replace('.0', '')}K`;
            }

            const badge = document.createElement("span");
            badge.className = "day-savings";
            badge.textContent = amountText;
            badge.title = `${savedAmount.toLocaleString()}원`;
            dayCell.appendChild(badge);
        }

        elCalendarGrid.appendChild(dayCell);
    }

    // 월 통계 정보 계산 및 갱신
    updateMonthlyStats(year, month);
}

// 월 통계 리포트 계산 및 렌더링
function updateMonthlyStats(year, month) {
    let monthlyTotal = 0;
    let monthlyCount = 0;

    // 타겟 연월 접두사 (예: "2026-06-")
    const targetPrefix = `${year}-${String(month + 1).padStart(2, '0')}-`;

    Object.entries(state.savedHistory).forEach(([dateStr, amount]) => {
        if (dateStr.startsWith(targetPrefix) && amount > 0) {
            monthlyTotal += amount;
            monthlyCount += 1;
        }
    });

    const averageSavings = monthlyCount > 0 ? Math.round(monthlyTotal / monthlyCount) : 0;

    elStatMonthlySavings.textContent = `${monthlyTotal.toLocaleString()}원`;
    elStatMonthlyCount.textContent = `${monthlyCount}회`;
    elStatMonthlyAverage.textContent = `${averageSavings.toLocaleString()}원`;
}

// 캘린더 모달 제어 이벤트 바인딩
document.getElementById("btnOpenCalendar").addEventListener("click", () => {
    // 캘린더 모달 열 때 오늘 기준으로 연월 포커싱
    const today = new Date();
    state.calendarYear = today.getFullYear();
    state.calendarMonth = today.getMonth();

    generateCalendar(state.calendarYear, state.calendarMonth);
    elCalendarModal.classList.add("active");
});

document.getElementById("btnCloseCalendar").addEventListener("click", () => {
    elCalendarModal.classList.remove("active");
});

// 이전 달로 이동
document.getElementById("btnPrevMonth").addEventListener("click", () => {
    state.calendarMonth -= 1;
    if (state.calendarMonth < 0) {
        state.calendarMonth = 11;
        state.calendarYear -= 1;
    }
    generateCalendar(state.calendarYear, state.calendarMonth);
});

// 다음 달로 이동
document.getElementById("btnNextMonth").addEventListener("click", () => {
    state.calendarMonth += 1;
    if (state.calendarMonth > 11) {
        state.calendarMonth = 0;
        state.calendarYear += 1;
    }
    generateCalendar(state.calendarYear, state.calendarMonth);
});

// 앱 초기화 실행
initApp();
