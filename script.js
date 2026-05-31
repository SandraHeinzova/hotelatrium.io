// === 1. HLAVNÍ CENÍK (Zde měňte ceny, automaticky se propíšou do webu i kalkulačky) ===
const ROOM_PRICES = {
    'room-single': 2300,
    'room-double': 2900,
    'room-double-ac': 3000,
    'room-apt-1': 2600,
    'room-apt-2': 3200,
    'room-apt-3': 3800
};


// === 2. GLOBÁLNÍ FUNKCE (Dostupné ihned pro HTML tlačítka) ===

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


// === 3. LOGIKA FORMULÁŘE A KALKULAČKY ===
document.addEventListener('DOMContentLoaded', () => {
    
    // --- AUTOMATICKÉ VYPLNĚNÍ CEN Z CENÍKU NAHOŘE ---
    for (const [roomId, price] of Object.entries(ROOM_PRICES)) {
        const roomContainer = document.getElementById(roomId);
        if (roomContainer) {
            // Propíše cenu jako text pro zákazníka (přidá " Kč / noc")
            roomContainer.querySelector('.room-price-tag').textContent = `${price} Kč / noc`;
            // Propíše cenu do data-price pro výpočet v kalkulačce
            roomContainer.querySelector('.room-input').dataset.price = price;
        }
    }

    const checkinInput = document.getElementById('checkin');
    const checkoutInput = document.getElementById('checkout');
    const parkingInput = document.getElementById('parking'); 
    const nightsDisplay = document.getElementById('nights-display');
    const totalPriceDisplay = document.getElementById('total-price-display');
    const roomInputs = document.querySelectorAll('.room-qty'); 

    // Nastavení minimálního data na dnešek
    const today = new Date().toISOString().split('T')[0];
    if(checkinInput && checkoutInput) {
        checkinInput.setAttribute('min', today);
        checkoutInput.setAttribute('min', today);
    }

function calculateStay() {
        // 1. Spočítáme vybrané pokoje VŽDY jako první
        let roomCostPerNight = 0;
        let totalRooms = 0;

        roomInputs.forEach(input => {
            const qty = parseInt(input.value) || 0; 
            // Použijeme || 0 jako pojistku, pokud by se cena nenačetla
            const price = parseInt(input.dataset.price) || 0; 
            
            if (qty > 0) {
                roomCostPerNight += (qty * price);
                totalRooms += qty;
            }
        });

        // 2. Kontrola, zda máme vyplněný termín (Příjezd a Odjezd)
        if (!checkinInput.value || !checkoutInput.value) {
            nightsDisplay.textContent = '';
            
            // Pokud nemáme data, ale uživatel naklikal pokoje, ukážeme mu mezisoučet
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
            return; // Tímto funkce končí, chybí nám dny pro finální násobení
        }

        // 3. Výpočet dnů a finální ceny (proběhne, jen když známe data pobytu)
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
            // Skloňování slova "noc"
            let nightText = 'nocí';
            if (diffDays === 1) nightText = 'noc';
            else if (diffDays >= 2 && diffDays <= 4) nightText = 'noci';

            nightsDisplay.textContent = `Délka pobytu: ${diffDays} ${nightText}`;
            nightsDisplay.style.color = 'var(--color-accent)'; 

            if (totalRooms > 0) {
                // Finální matematika
                const finalPrice = (diffDays * roomCostPerNight) + parkingTotal;
                const formattedPrice = finalPrice.toLocaleString('cs-CZ');
                
                let detailsText = `(za ${totalRooms} pokoj(e)`;
                if (isParking) {
                    detailsText += ` + parkování na ${diffDays} ${nightText}`;
                }
                detailsText += `)`;

                // Vykreslení obří finální ceny
                totalPriceDisplay.innerHTML = `
                    Celková cena: <span style="font-size: 1.8rem;">${formattedPrice} Kč</span> 
                    <small style="font-size: 0.9rem; font-weight: 400; display:block; margin-top:5px;">${detailsText}</small>
                `;
            } else {
                totalPriceDisplay.innerHTML = `<span style="font-size: 1rem; color: #666; font-weight: 400;">Pro zobrazení ceny zadejte počet pokojů.</span>`;
            }
            
        } else {
            // Ošetření chyby (odjezd je dříve než příjezd)
            nightsDisplay.textContent = 'Datum odjezdu musí být později než datum příjezdu.';
            nightsDisplay.style.color = '#d32f2f';
            totalPriceDisplay.textContent = '';
        }
    }

    if(checkinInput) checkinInput.addEventListener('change', calculateStay);
    if(checkoutInput) checkoutInput.addEventListener('change', calculateStay);
    if(parkingInput) parkingInput.addEventListener('change', calculateStay); 
    
    roomInputs.forEach(input => {
        input.addEventListener('change', calculateStay);
        input.addEventListener('input', calculateStay);
    });
});