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
    let headers, skuIndex, skuVarIndex, skuNameIndex, quantityLimitIndex, categoryIndex, subcategoryIndex;

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
            categoryIndex = headers.indexOf('Category');
            subcategoryIndex = headers.indexOf('SubCategory');

            if (skuIndex === -1 || skuVarIndex === -1 || skuNameIndex === -1 || quantityLimitIndex === -1 || categoryIndex === -1 || subcategoryIndex === -1) {
                console.error('Required headers not found.');
                return;
            }

            const categories = new Set(items.slice(1).map(item => item[categoryIndex] || ''));
            const galleryContainer = document.getElementById('galleryContainer');
            const categorySelect = createDropdown('categorySelect', categories);
            const subcategorySelect = createDropdown('subcategorySelect', new Set());

            categorySelect.addEventListener('change', () => {
                filterSubcategories(subcategorySelect, categorySelect.value);
                displayGallery();
            });
            subcategorySelect.addEventListener('change', displayGallery);

            galleryContainer.appendChild(createLabel('Category:', 'categorySelect'));
            galleryContainer.appendChild(categorySelect);
            galleryContainer.appendChild(createLabel('SubCategory:', 'subcategorySelect'));
            galleryContainer.appendChild(subcategorySelect);

            const resetButton = document.createElement('button');
            resetButton.textContent = 'Reset';
            resetButton.addEventListener('click', () => {
                categorySelect.value = 'All';
                subcategorySelect.value = 'All';
                displayGallery();
            });
            galleryContainer.appendChild(resetButton);

            displayGallery();
            document.getElementById('csvGallery').style.display = 'flex';
        })
        .catch(error => console.error('Error fetching CSV:', error));

    function createDropdown(id, options) {
        const select = document.createElement('select');
        select.id = id;
        select.appendChild(createOption('All'));
        options.forEach(optionValue => {
            if (optionValue) {
                select.appendChild(createOption(optionValue));
            }
        });
        return select;
    }

    function filterSubcategories(subcategorySelect, selectedCategory) {
        const subcategories = new Set(items
            .slice(1)
            .filter(item => item[categoryIndex] === selectedCategory)
            .map(item => item[subcategoryIndex] || '')
        );

        subcategorySelect.innerHTML = ''; // Clear previous options
        subcategorySelect.appendChild(createOption('All')); // Add "All" option

        subcategories.forEach(optionValue => {
            if (optionValue) {
                subcategorySelect.appendChild(createOption(optionValue));
            }
        });
    }

    function displayGallery() {
        const selectedCategory = document.getElementById('categorySelect').value;
        const selectedSubcategory = document.getElementById('subcategorySelect').value;

        const gallery = document.getElementById('csvGallery');
        gallery.innerHTML = '';
        let itemCount = 0;

        const skuGroups = new Map();

        for (let i = 1; i < items.length; i++) {
            const item = items[i];
            const sku = item[skuIndex];
            const skuVar = item[skuVarIndex];
            const quantityLimit = item[quantityLimitIndex] === 'True';
            const categoryMatch = selectedCategory === 'All' || item[categoryIndex] === selectedCategory;
            const subcategoryMatch = selectedSubcategory === 'All' || item[subcategoryIndex] === selectedSubcategory;

            if (categoryMatch && subcategoryMatch) {
                const key = `${sku}-${skuVar}`;
                if (!skuGroups.has(key)) {
                    skuGroups.set(key, {
                        count: 1,
                        skuName: item[skuNameIndex],
                        imageUrl: item[0],
                        quantityLimit: quantityLimit,
                        sku: sku
                    });
                } else {
                    skuGroups.get(key).count++;
                }
            }
        }

        skuGroups.forEach(({ count, skuName, imageUrl, quantityLimit, sku }) => {
            const div = createCard(skuName, quantityLimit ? count : '', imageUrl, sku);
            gallery.appendChild(div);
            itemCount++;
        });

        document.getElementById('itemCount').textContent = ` ${itemCount} Found`;
    }

    function createCard(skuName, skuCount, imageUrl, sku) {
        const div = document.createElement('div');
        div.classList.add('card');

        div.addEventListener('click', function() {
            const modalImg = document.getElementById("img01");
            const captionText = document.getElementById("caption");

            modal.style.display = "block"; 
            modalImg.src = imageUrl;
            captionText.innerHTML = skuName;

            document.body.classList.add('modal-open');
        });

        const contentDiv = createContentDiv(skuName, skuCount, imageUrl, sku);
        div.appendChild(contentDiv);

        return div;
    }

    function createContentDiv(skuName, skuCount, imageUrl, sku) {
        const contentDiv = document.createElement('div');
        contentDiv.style.display = 'flex';
        contentDiv.style.flexDirection = 'column';

        const imageContainer = document.createElement('div');
        const img = createImage(imageUrl);
        imageContainer.appendChild(img);
        contentDiv.appendChild(imageContainer);

        const title = createParagraph(skuName, 'title');
        contentDiv.appendChild(title);

        // Show SKU count if QuantityLimit is True
        const availableCountDiv = document.createElement('div');
        availableCountDiv.classList.add('available-count');
        if (skuCount) {
            availableCountDiv.textContent = `${skuCount} Available`;
        }
        contentDiv.appendChild(availableCountDiv);

        // Just show the SKU number
        const skuDiv = document.createElement('div');
        skuDiv.classList.add('sku');
        skuDiv.textContent = sku; // Only show the SKU number
        contentDiv.appendChild(skuDiv);

        return contentDiv;
    }

    function createImage(src) {
        const img = document.createElement('img');
        img.src = src;
        img.alt = 'Thumbnail';
        img.classList.add('thumbnail');
        return img;
    }

    function createParagraph(text, className) {
        const p = document.createElement('p');
        p.textContent = text;
        p.classList.add(className);
        return p;
    }

    function createOption(value) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        return option;
    }

    function createLabel(text, htmlFor) {
        const label = document.createElement('label');
        label.textContent = text;
        label.htmlFor = htmlFor;
        return label;
    }

    // Live search function
    let timeout = null;

    function liveSearch() {
        clearTimeout(timeout);

        const input = document.getElementById("myInput");
        const filter = input.value.toUpperCase();
        const gallery = document.getElementById('csvGallery');
        const cards = gallery.getElementsByClassName('card');

        let itemCount = 0; 
        Array.from(cards).forEach(card => {
            const title = card.getElementsByClassName("title")[0];
            const sku = card.getElementsByClassName("sku")[0];
            const txtValueTitle = title ? title.textContent || title.innerText : '';
            const txtValueSku = sku ? sku.textContent || sku.innerText : '';

            if (txtValueTitle.toUpperCase().includes(filter) || txtValueSku.toUpperCase().includes(filter)) {
                card.style.display = "";
                itemCount++;
            } else {
                card.style.display = "none";
            }
        });

        document.getElementById('itemCount').textContent = ` ${itemCount} Found`;

        timeout = setTimeout(() => {
            input.value = '';
        }, 1500);
    }

    // Event listener for live search input
    document.getElementById("myInput").addEventListener('input', liveSearch);
});
