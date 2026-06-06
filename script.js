// === 1. HLAVNÍ CENÍK (Zde měňte ceny, automaticky se propíšou do webu i kalkulačky) ===
const ROOM_PRICES = {
    'room-single': 2300,
    'room-double': 2900,
    'room-double-ac': 3000,
    'room-apt-1': 2600,
    'room-apt-2': 3200,
    'room-apt-3': 3800
};

// === 2. GLOBÁLNÍ FUNKCE PRO MENU A AKCE (Dostupné pro oba HTML soubory) ===
document.addEventListener('DOMContentLoaded', () => {
    
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const navMenu = document.querySelector('.nav-menu'); 

    if (hamburgerBtn && navMenu) {
        hamburgerBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            hamburgerBtn.classList.toggle('active');
        });
    }
});

// ==========================================================================
// OVLÁDÁNÍ KARUSELU AKCÍ (Kalendář v index.html)
// ==========================================================================

function scrollEvents(direction) {
    const track = document.getElementById('eventsTrack');
    if (!track) return;

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
    const btnPrev = document.getElementById('btnEventsPrev');
    const btnNext = document.getElementById('btnEventsNext');

    if (btnPrev && btnNext) {
        btnPrev.addEventListener('click', () => {
            scrollEvents(-1);
        });

        btnNext.addEventListener('click', () => {
            scrollEvents(1);
        });
    }
});

// === 3. LOGIKA REZERVAČNÍHO FORMULÁŘE A KALKULAČKY ===
document.addEventListener('DOMContentLoaded', () => {
    
    // Automatické vyplnění cen z ceníku do šablony
    for (const [roomId, price] of Object.entries(ROOM_PRICES)) {
        const roomContainer = document.getElementById(roomId);
        if (roomContainer) {
            const priceTag = roomContainer.querySelector('.room-price-tag');
            if(priceTag) priceTag.textContent = `${price} Kč / noc`;
            
            const inputField = roomContainer.querySelector('.room-input');
            if(inputField) inputField.dataset.price = price;
        }
    }

    // Načtení prvků formuláře z HTML
    const checkinInput = document.getElementById('checkin');
    const checkoutInput = document.getElementById('checkout');
    const parkingInput = document.getElementById('parking'); 
    const nightsDisplay = document.getElementById('nights-display');
    const totalPriceDisplay = document.getElementById('total-price-display');
    const roomInputs = document.querySelectorAll('.room-qty'); 

    // BEZPEČNOSTNÍ POJISTKA: Pokud jsme na index.html, kde formulář není, skript zde tiše skončí
    if (!checkinInput && roomInputs.length === 0) return;

    // Nastavení minimálního povoleného data v kalendáři na dnešek
    const today = new Date().toISOString().split('T')[0];
    if(checkinInput && checkoutInput) {
        checkinInput.setAttribute('min', today);
        checkoutInput.setAttribute('min', today);
    }

    // --- HLAVNÍ FUNKCE PRO VÝPOČET POBYTU A KONTROLU LIMITŮ ---
    function calculateStay() {
        let roomCostPerNight = 0;
        let totalRooms = 0;
        let totalApartments = 0;
        let totalDoubleAc = 0;

        // 1. Spočítáme stavy vybraných pokojů
        roomInputs.forEach(input => {
            const qty = parseInt(input.value) || 0; 
            const price = parseInt(input.dataset.price) || 0; 
            
            if (qty > 0) {
                roomCostPerNight += (qty * price);
                totalRooms += qty;
                
                const parentRow = input.closest('.room-selection-item');
                if (parentRow) {
                    if (parentRow.id.startsWith('room-apt-')) totalApartments += qty;
                    if (parentRow.id === 'room-double-ac') totalDoubleAc += qty;
                }
            }
        });

        const warningDiv = document.getElementById('room-capacity-warning');
        const submitBtn = document.querySelector('.btn-submit-form');

        // --- PREVENCE CHYBY (UX): Aktivní zamykání/odemykání tlačítek PLUS ---
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
                    
                    if (currentVal >= maxAttr) {
                        plusBtn.title = "Dosaženo maximum pro tento typ pokoje";
                    } else if (totalRooms >= 16) {
                        plusBtn.title = "Dosažena maximální celková kapacita hotelu (16 pokojů)";
                    } else if (isApt && totalApartments >= 4) {
                        plusBtn.title = "Dosažena maximální kapacita apartmánů (4 apartmány celkem)";
                    } else if (isDoubleAc && totalDoubleAc >= 4) {
                        plusBtn.title = "Dosažena kapacita pokojů s klimatizací (max 4)";
                    }
                } else {
                    plusBtn.disabled = false;
                    plusBtn.title = "Přidat pokoj";
                }
            }
        });

        // --- UX OPTIMALIZACE: PRIORITNÍ KASKÁDA PRO JEDNU HLÁŠKU ---
        let warningText = "";
        let isInvalid = false;

        if (totalRooms > 16) {
            warningText = `Překročena celková kapacita hotelu! Máme pouze 16 pokojů (vybráno ${totalRooms}).`;
            isInvalid = true;
        } else if (totalApartments > 4) {
            warningText = `Překročena kapacita apartmánů! Máme pouze 4 apartmány celkem (vybráno ${totalApartments}).`;
            isInvalid = true;
        } else if (totalDoubleAc > 4) {
            warningText = `Překročena kapacita pokojů s klimatizací! Máme pouze 4 tyto pokoje celkem (vybráno ${totalDoubleAc}).`;
            isInvalid = true;
        } else if (totalRooms === 16) {
            warningText = "Dosažena maximální celková kapacita hotelu (16 pokojů).";
        } else if (totalApartments === 4) {
            warningText = "Dosažena maximální kapacita apartmánů (4 apartmány celkem).";
        } else if (totalDoubleAc === 4) {
            warningText = "Dosažena maximální kapacita dvoulůžkových pokojů s klimatizací (4 pokoje celkem).";
        }

        // Vykreslení vybrané jediné hlášky na stránku
        if (warningDiv) {
            if (warningText) {
                warningDiv.textContent = warningText;
                warningDiv.classList.remove('hidden');
            } else {
                warningDiv.classList.add('hidden');
            }
        }

        // Tvrdá pojistka pro odesílací tlačítko
        if (isInvalid) {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.5';
                submitBtn.style.cursor = 'not-allowed';
            }
            if (nightsDisplay) nightsDisplay.textContent = '';
            if (totalPriceDisplay) {
                totalPriceDisplay.innerHTML = `<span style="color: #9E3D2F; font-weight:700; font-size: 1.1rem;">Neplatný výběr pokojů (překročena kapacita hotelu).</span>`;
            }
            return; 
        } else {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                submitBtn.style.cursor = 'pointer';
            }
        }

        // Zobrazení mezisoučtu, pokud chybí vyplněný kalendář
        if (!checkinInput.value || !checkoutInput.value) {
            if (nightsDisplay) nightsDisplay.textContent = '';
            if (totalPriceDisplay) {
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
            }
            return; 
        }

        // VÝPOČET FINÁLNÍ CENY (Máme termín i pokoje v pořádku)
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

            if (nightsDisplay) {
                nightsDisplay.textContent = `Délka pobytu: ${diffDays} ${nightText}`;
                nightsDisplay.style.color = 'var(--color-accent)'; 
            }

            if (totalPriceDisplay) {
                if (totalRooms > 0) {
                    const finalPrice = (diffDays * roomCostPerNight) + parkingTotal;
                    const formattedPrice = finalPrice.toLocaleString('cs-CZ');
                    
                    let detailsText = `(za ${totalRooms} pokoj(e)`;
                    if (isParking) detailsText += ` + parkování na ${diffDays} ${nightText}`;
                    detailsText += `)`;

                    totalPriceDisplay.innerHTML = `
                        Celková cena: <span style="font-size: 1.8rem; font-weight: 700; color: var(--color-primary);">${formattedPrice} Kč</span> 
                        <small style="font-size: 0.9rem; font-weight: 400; display:block; margin-top:5px; color: var(--color-text-light);">${detailsText}</small>
                    `;
                } else {
                    totalPriceDisplay.innerHTML = `<span style="font-size: 1rem; color: #666; font-weight: 400;">Pro zobrazení ceny zadejte počet pokojů.</span>`;
                }
            }
            
        } else {
            if (nightsDisplay) {
                nightsDisplay.textContent = 'Datum odjezdu musí být později než datum příjezdu.';
                nightsDisplay.style.color = '#d32f2f';
            }
            if (totalPriceDisplay) totalPriceDisplay.textContent = '';
        }
    }

    // --- NAVÁZÁNÍ EVENT LISTENERŮ ---
    if(checkinInput) checkinInput.addEventListener('change', calculateStay);
    if(checkoutInput) checkoutInput.addEventListener('change', calculateStay);
    if(parkingInput) parkingInput.addEventListener('change', calculateStay); 
    
    roomInputs.forEach(input => {
        input.addEventListener('input', function() {
            let val = parseInt(this.value) || 0;
            let max = parseInt(this.getAttribute('max')) || 99;
            if (val > max) this.value = max;
            if (val < 0) this.value = 0;
            calculateStay();
        });
    });

    const minusBtns = document.querySelectorAll('.qty-btn.minus');
    minusBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const wrapper = e.target.closest('.qty-wrapper');
            if (!wrapper) return;
            const input = wrapper.querySelector('.room-qty');
            
            if (input) {
                let val = parseInt(input.value) || 0;
                if (val > 0) {
                    input.value = val - 1;
                    input.dispatchEvent(new Event('input')); 
                }
            }
        });
    });

    const plusBtns = document.querySelectorAll('.qty-btn.plus');
    plusBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const wrapper = e.target.closest('.qty-wrapper');
            if (!wrapper) return;
            const input = wrapper.querySelector('.room-qty');
            
            if (input) {
                let val = parseInt(input.value) || 0;
                let max = parseInt(input.getAttribute('max')) || 99;
                if (val < max) {
                    input.value = val + 1;
                    input.dispatchEvent(new Event('input')); 
                }
            }
        });
    });
});
