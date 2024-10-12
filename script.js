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
    let headers, skuIndex, categoryIndex, subcategoryIndex;

    fetch('Resources.csv')
        .then(response => response.text())
        .then(csvData => {
            // Replace %23 with #
            csvData = csvData.replace(/%23/g, '#');

            // Use a regex to handle CSV parsing with quotes
            items = csvData.split('\n')
                .filter(row => row.trim().length > 0)
                .map(row => row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g).map(cell => cell.replace(/^"|"$/g, '').trim()));

            headers = items[0];

            // Find the indices we need
            skuIndex = headers.indexOf('SKU');
            categoryIndex = headers.indexOf('Category');
            subcategoryIndex = headers.indexOf('SubCategory');

            if (skuIndex === -1 || categoryIndex === -1 || subcategoryIndex === -1) {
                console.error('Required headers not found.');
                return;
            }

            // Populate categories and subcategories
            const categories = new Set(items.slice(1).map(item => item[categoryIndex] || ''));
            const subcategories = new Set(items.slice(1).map(item => item[subcategoryIndex] || ''));

            const galleryContainer = document.getElementById('galleryContainer');
            const categorySelect = createDropdown('categorySelect', categories);
            const subcategorySelect = createDropdown('subcategorySelect', subcategories);

            categorySelect.addEventListener('change', displayGallery);
            subcategorySelect.addEventListener('change', displayGallery);

            // Insert labels and dropdowns
            galleryContainer.appendChild(createLabel('Category:', 'categorySelect'));
            galleryContainer.appendChild(categorySelect);
            galleryContainer.appendChild(createLabel('SubCategory:', 'subcategorySelect'));
            galleryContainer.appendChild(subcategorySelect);

            // Add reset button
            const resetButton = document.createElement('button');
            resetButton.textContent = 'Reset';
            resetButton.addEventListener('click', () => {
                categorySelect.value = 'All';
                subcategorySelect.value = 'All';
                displayGallery();
            });
            galleryContainer.appendChild(resetButton);

            displayGallery(); // Initially display all items
            document.getElementById('csvGallery').style.display = 'flex';
        })
        .catch(error => console.error('Error fetching CSV:', error));

    // Helper functions
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

    function displayGallery() {
        const selectedCategory = document.getElementById('categorySelect').value;
        const selectedSubcategory = document.getElementById('subcategorySelect').value;

        const gallery = document.getElementById('csvGallery');
        gallery.innerHTML = '';
        let itemCount = 0;

        const skuGroups = new Map();
        const skuCounts = new Map();

        for (let i = 1; i < items.length; i++) {
            const item = items[i];
            const categoryMatch = selectedCategory === 'All' || item[categoryIndex] === selectedCategory;
            const subcategoryMatch = selectedSubcategory === 'All' || item[subcategoryIndex] === selectedSubcategory;

            if (categoryMatch && subcategoryMatch) {
                const sku = item[skuIndex];
                if (!skuGroups.has(sku)) {
                    skuGroups.set(sku, item);
                    skuCounts.set(sku, 1);
                } else {
                    skuCounts.set(sku, skuCounts.get(sku) + 1);
                }
            }
        }

        skuGroups.forEach((item, sku) => {
            const div = createCard(item, skuCounts.get(sku));
            gallery.appendChild(div);
            itemCount++;
        });

        document.getElementById('itemCount').textContent = ` ${itemCount} Found`;
    }

    function createCard(dataRowItems, skuCount) {
        const div = document.createElement('div');
        div.classList.add('card');

        const title = dataRowItems[headers.indexOf('Title')];

        div.addEventListener('click', function() {
            const img = div.querySelector('img');
            const modalImg = document.getElementById("img01");
            const captionText = document.getElementById("caption");

            modal.style.display = "block"; 
            modalImg.src = img.src;
            captionText.innerHTML = title;

            document.body.classList.add('modal-open');
        });

        const contentDiv = createContentDiv(dataRowItems);
        div.appendChild(contentDiv);

        // Add SKU count display
        const skuCountDiv = document.createElement('div');
        skuCountDiv.classList.add('sku-count');
        skuCountDiv.textContent = `${skuCount} similar items`;
        skuCountDiv.style.textAlign = 'left'; // Align text to the left
        div.appendChild(skuCountDiv); // Append SKU count to card

        return div;
    }

    function createContentDiv(dataRowItems) {
        const contentDiv = document.createElement('div');
        contentDiv.style.display = 'flex';
        contentDiv.style.flexDirection = 'column';

        let img, title, sku;

        dataRowItems.forEach((cell, cellIndex) => {
            if (headers[cellIndex] === 'Title') {
                title = createParagraph(cell, 'title');
            } else if (headers[cellIndex] === 'SKU') {
                sku = createParagraph(cell, 'sku');
            } else if (cellIndex === 0) { // Assuming the first column is the image URL
                img = createImage(cell);
            }
        });

        contentDiv.appendChild(img);
        contentDiv.appendChild(title);
        contentDiv.appendChild(sku);
        return contentDiv;
    }

    function createImage(cell) {
        const img = document.createElement('img');
        img.src = cell;
        img.alt = 'Thumbnail';
        img.classList.add('thumbnail');
        return img;
    }

    function createParagraph(cell, className) {
        const p = document.createElement('p');
        p.textContent = cell;
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
