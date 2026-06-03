const ROOM_PRICES = {
    'room-single': 2300,
    'room-double': 2900,
    'room-double-ac': 3000,
    'room-apt-1': 2600,
    'room-apt-2': 3200,
    'room-apt-3': 3800
};

window.toggleMenu = function() {
    const menu = document.querySelector('.nav-menu');
    menu.classList.toggle('active');
}

window.switchView = function(viewName, sectionId = null) {
    const homeView = document.getElementById('view-home');
    const reservationView = document.getElementById('view-reservation');
    
    document.querySelector('.nav-menu').classList.remove('active');

    if (viewName === 'home') {
        homeView.classList.remove('hidden');
        reservationView.classList.add('hidden');
        
        if (sectionId) {
            setTimeout(() => {
                const section = document.getElementById(sectionId);
                if (section) section.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    } else if (viewName === 'reservation') {
        homeView.classList.add('hidden');
        reservationView.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

window.scrollEvents = function(direction) {
    const track = document.getElementById('eventsTrack');
    if(!track) return;

    const itemWidth = 375; 
    const currentScroll = track.scrollLeft;
    const maxScroll = track.scrollWidth - track.clientWidth;

    if (direction === -1 && currentScroll <= 10) {
        track.scrollTo({ left: maxScroll, behavior: 'smooth' });
        return;
    }

    if (direction === 1 && currentScroll >= (maxScroll - 10)) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
        return;
    }

    track.scrollBy({ left: direction * itemWidth, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', () => {
    
    for (const [roomId, price] of Object.entries(ROOM_PRICES)) {
        const roomContainer = document.getElementById(roomId);
        if (roomContainer) {
            const priceTag = roomContainer.querySelector('.room-price-tag');
            if(priceTag) priceTag.textContent = `${price} Kč / noc`;
            
            const inputField = roomContainer.querySelector('.room-input');
            if(inputField) inputField.dataset.price = price;
        }
    }

    const checkinInput = document.getElementById('checkin');
    const checkoutInput = document.getElementById('checkout');
    const parkingInput = document.getElementById('parking'); 
    const nightsDisplay = document.getElementById('nights-display');
    const totalPriceDisplay = document.getElementById('total-price-display');
    const roomInputs = document.querySelectorAll('.room-qty'); 

    const today = new Date().toISOString().split('T')[0];
    if(checkinInput && checkoutInput) {
        checkinInput.setAttribute('min', today);
        checkoutInput.setAttribute('min', today);
    }

    function calculateStay() {
        let roomCostPerNight = 0;
        let totalRooms = 0;
        let totalApartments = 0;
        let totalDoubleAc = 0;
        roomInputs.forEach(input => {
            const qty = parseInt(input.value) || 0; 
            const price = parseInt(input.dataset.price) || 0; 
            
            if (qty > 0) {
                roomCostPerNight += (qty * price);
                totalRooms += qty;
                
                const parentRow = input.closest('.room-selection-item');
                if (parentRow) {
                    if (parentRow.id.startsWith('room-apt-')) {
                        totalApartments += qty;
                    }
                    if (parentRow.id === 'room-double-ac') {
                        totalDoubleAc += qty;
                    }
                }
            }
        });

        const warningDiv = document.getElementById('room-capacity-warning');
        const submitBtn = document.querySelector('.btn-submit-form');

        roomInputs.forEach(input => {
            const parentRow = input.closest('.room-selection-item');
            if (!parentRow) return;

            const isApt = parentRow.id.startsWith('room-apt-');
            const isDoubleAc = parentRow.id === 'room-double-ac'; 
            const plusBtn = parentRow.querySelector('.qty-btn.plus');
            const currentVal = parseInt(input.value) || 0;
            const maxAttr = parseInt(input.getAttribute('max')) || 99;

            if (plusBtn) {
                if (currentVal >= maxAttr || totalRooms >= 16 || (isApt && totalApartments >= 4) || (isDoubleAc && totalDoubleAc >= 4)) {
                    plusBtn.disabled = true;
                    
                    if (currentVal >= maxAttr || (isDoubleAc && totalDoubleAc >= 4)) {
                        plusBtn.title = `Dosaženo maximum pro tento typ pokoje (${maxAttr} pokoje celkem)`;
                    } else if (totalRooms >= 16) {
                        plusBtn.title = "Dosažena maximální celková kapacita hotelu (16 pokojů)";
                    } else if (isApt && totalApartments >= 4) {
                        plusBtn.title = "Dosažena maximální kapacita apartmánů (4 apartmány celkem)";
                    }
                } else {
                    plusBtn.disabled = false;
                    plusBtn.title = "Přidat pokoj";
                }
            }
        });

        if (totalRooms > 16) {
            warningDiv.textContent = `Překročena celková kapacita hotelu! Máme pouze 16 pokojů (vybráno ${totalRooms}).`;
            warningDiv.classList.remove('hidden');
        } else if (totalApartments > 4) {
            warningDiv.textContent = `Překročena kapacita apartmánů! Máme pouze 4 apartmány celkem (vybráno ${totalApartments}).`;
            warningDiv.classList.remove('hidden');
        } else if (totalDoubleAc > 4) { // NOVÉ
            warningDiv.textContent = `Překročena kapacita pokojů s klimatizací! Máme pouze 4 tyto pokoje celkem (vybráno ${totalDoubleAc}).`;
            warningDiv.classList.remove('hidden');
        } else if (totalRooms === 16) {
            warningDiv.textContent = "Dosažena maximální celková kapacita hotelu (16 pokojů).";
            warningDiv.classList.remove('hidden');
        } else if (totalApartments === 4) {
            warningDiv.textContent = "Dosažena maximální kapacita apartmánů (4 apartmány celkem).";
            warningDiv.classList.remove('hidden');
        } else if (totalDoubleAc === 4) { 
            warningDiv.textContent = "Dosažena maximální kapacita dvoulůžkových pokojů s klimatizací (4 pokoje celkem).";
            warningDiv.classList.remove('hidden');
        } else {
            warningDiv.classList.add('hidden'); 
        }

        if (totalRooms > 16 || totalApartments > 4 || totalDoubleAc > 4) {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.5';
                submitBtn.style.cursor = 'not-allowed';
            }
            nightsDisplay.textContent = '';
            totalPriceDisplay.innerHTML = `<span style="color: #9E3D2F; font-weight:700;">Neplatný výběr (překročena kapacita hotelu).</span>`;
            return; 
        } else {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                submitBtn.style.cursor = 'pointer';
            }
        }

        if (!checkinInput.value || !checkoutInput.value) {
            nightsDisplay.textContent = '';
            
            if (totalRooms > 0) {
                totalPriceDisplay.innerHTML = `
                    <span style="font-size: 1.1rem; color: var(--color-primary); font-weight: 700;">
                        Vybráno pokojů: ${totalRooms}
                    </span>
                    <br>
                    <small style="font-size: 0.95rem; color: var(--color-text-light); font-weight: 400;">
                        Cena za 1 noc: ${roomCostPerNight.toLocaleString('cs-CZ')} Kč.<br>
                        (Pro výpočet celkové ceny prosím vyplňte nahoře termín pobytu)
                    </small>
                `;
            } else {
                totalPriceDisplay.innerHTML = '';
            }
            return; 
        }

        const date1 = new Date(checkinInput.value);
        const date2 = new Date(checkoutInput.value);
        
        const diffTime = date2 - date1;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let parkingTotal = 0;
        const isParking = parkingInput && parkingInput.checked;
        if (isParking && diffDays > 0) {
            parkingTotal = 150 * diffDays;
        }

        if (diffDays > 0) {
            let nightText = 'nocí';
            if (diffDays === 1) nightText = 'noc';
            else if (diffDays >= 2 && diffDays <= 4) nightText = 'noci';

            nightsDisplay.textContent = `Délka pobytu: ${diffDays} ${nightText}`;
            nightsDisplay.style.color = 'var(--color-accent)'; 

            if (totalRooms > 0) {
                const finalPrice = (diffDays * roomCostPerNight) + parkingTotal;
                const formattedPrice = finalPrice.toLocaleString('cs-CZ');
                
                let detailsText = `(za ${totalRooms} pokoj(e)`;
                if (isParking) {
                    detailsText += ` + parkování na ${diffDays} ${nightText}`;
                }
                detailsText += `)`;

                totalPriceDisplay.innerHTML = `
                    Celková cena: <span style="font-size: 1.8rem;">${formattedPrice} Kč</span> 
                    <small style="font-size: 0.9rem; font-weight: 400; display:block; margin-top:5px;">${detailsText}</small>
                `;
            } else {
                totalPriceDisplay.innerHTML = `<span style="font-size: 1rem; color: #666; font-weight: 400;">Pro zobrazení ceny zadejte počet pokojů.</span>`;
            }
            
        } else {
            nightsDisplay.textContent = 'Datum odjezdu mustí být později než datum příjezdu.';
            nightsDisplay.style.color = '#d32f2f';
            totalPriceDisplay.textContent = '';
        }
    }

    if(checkinInput) checkinInput.addEventListener('change', calculateStay);
    if(checkoutInput) checkoutInput.addEventListener('change', calculateStay);
    if(parkingInput) parkingInput.addEventListener('change', calculateStay); 
    
    roomInputs.forEach(input => {
        input.addEventListener('input', function() {
            let val = parseInt(this.value) || 0;
            let max = parseInt(this.getAttribute('max')) || 99;
            
            if (val > max) {
                this.value = max;
            }
            if (val < 0) {
                this.value = 0;
            }
            calculateStay();
        });
    });

    const minusBtns = document.querySelectorAll('.qty-btn.minus');
    const plusBtns = document.querySelectorAll('.qty-btn.plus');

    minusBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const input = e.target.nextElementSibling;
            let val = parseInt(input.value) || 0;
            const min = parseInt(input.getAttribute('min')) || 0;
            
            if (val > min) {
                input.value = val - 1;
                input.dispatchEvent(new Event('input')); 
            }
        });
    });

    plusBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const input = e.target.previousElementSibling;
            let val = parseInt(input.value) || 0;
            const max = parseInt(input.getAttribute('max')) || 99;
            
            if (val < max) {
                input.value = val + 1;
                input.dispatchEvent(new Event('input')); 
            }
        });
    });

});
