document.addEventListener('DOMContentLoaded', (event) => {
    // Modal initialization
    const modal = document.getElementById("myModal");
    const closeModalButton = modal.querySelector(".close");
    modal.style.display = "none";

    // Function to close the modal
    function closeModal() {
        modal.style.display = "none";
        document.body.classList.remove('modal-open');
    }

    // Event listeners for closing the modal
    closeModalButton.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    // Fetch CSV data and set up gallery
    let items = [];
    let headers, skuIndex, skuVarIndex, skuNameIndex, quantityLimitIndex;

    fetch('Resources.csv')
        .then(response => response.text())
        .then(csvData => {
            csvData = csvData.replace(/%23/g, '#');

            items = csvData.split('\n')
                .filter(row => row.trim().length > 0)
                .map(row => row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g).map(cell => cell.replace(/^"|"$/g, '').trim()));

            headers = items[0];

            skuIndex = headers.indexOf('SKU');
            skuVarIndex = headers.indexOf('SKUVAR');
            skuNameIndex = headers.indexOf('SKUName');
            quantityLimitIndex = headers.indexOf('QuantityLimit');

            if (skuIndex === -1 || skuVarIndex === -1 || skuNameIndex === -1 || quantityLimitIndex === -1) {
                console.error('Required headers not found.');
                return;
            }

            // Other code for setting up categories and subcategories...

            displayGallery();
            document.getElementById('csvGallery').style.display = 'flex';
        })
        .catch(error => console.error('Error fetching CSV:', error));

    function displayGallery() {
        // Other filtering logic...

        const skuGroups = new Map();

        for (let i = 1; i < items.length; i++) {
            const item = items[i];
            // Assuming category and subcategory filtering is done...

            const sku = item[skuIndex];
            const skuVar = item[skuVarIndex];
            const quantityLimit = item[quantityLimitIndex] === 'True'; // Ensure you're checking against string 'True'

            const key = `${sku}-${skuVar}`; // Create unique key for grouping
            if (!skuGroups.has(key)) {
                skuGroups.set(key, {
                    count: 1,
                    skuName: item[skuNameIndex],
                    quantityLimit: quantityLimit
                });
            } else {
                skuGroups.get(key).count++;
            }
        }

        skuGroups.forEach(({ count, skuName, quantityLimit }) => {
            const div = createCard(skuName, quantityLimit ? '' : count);
            gallery.appendChild(div);
        });

        document.getElementById('itemCount').textContent = ` ${gallery.childElementCount} Found`;
    }

    function createCard(skuName, skuCount) {
        const div = document.createElement('div');
        div.classList.add('card');

        div.addEventListener('click', function() {
            // Modal handling...
        });

        const contentDiv = createContentDiv(skuName, skuCount);
        div.appendChild(contentDiv);

        return div;
    }

    function createContentDiv(skuName, skuCount) {
        const contentDiv = document.createElement('div');
        contentDiv.style.display = 'flex';
        contentDiv.style.flexDirection = 'column';

        const title = createParagraph(skuName, 'title');
        contentDiv.appendChild(title);

        const availableCountDiv = document.createElement('div');
        availableCountDiv.classList.add('available-count');
        availableCountDiv.textContent = skuCount ? `${skuCount} Available` : '';
        contentDiv.appendChild(availableCountDiv);

        return contentDiv;
    }

    // Other helper functions...
});
