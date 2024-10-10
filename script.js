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
            items = csvData.split('\n')
                .filter(row => row.trim().length > 0) // Ensure no empty rows
                .map(row => row.split(',').map(cell => cell.trim())); // Trim each cell

            headers = items[0];
            skuIndex = headers.indexOf('SKU');
            categoryIndex = headers.indexOf('Category');
            subcategoryIndex = headers.indexOf('Subcategory');

            // Populate categories and subcategories
            const categories = new Set(items.slice(1).map(item => item[categoryIndex] || '')); // Handle empty categories
            const subcategories = new Set(items.slice(1).map(item => item[subcategoryIndex] || '')); // Handle empty subcategories

            const galleryContainer = document.getElementById('galleryContainer');
            const categorySelect = createDropdown('categorySelect', categories);
            const subcategorySelect = createDropdown('subcategorySelect', subcategories);

            categorySelect.addEventListener('change', displayGallery);
            subcategorySelect.addEventListener('change', displayGallery);

            // Insert labels and dropdowns
            galleryContainer.appendChild(createLabel('Category:', 'categorySelect'));
            galleryContainer.appendChild(categorySelect);
            galleryContainer.appendChild(createLabel('Subcategory:', 'subcategorySelect'));
            galleryContainer.appendChild(subcategorySelect);

            // Add reset button
            const resetButton = document.createElement('button');
            resetButton.textContent = 'Reset';
            resetButton.addEventListener('click', () => {
                categorySelect.value = 'All';
                subcategorySelect.value = 'All';
                displayGallery(); // Refresh the gallery
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
            if (optionValue) { // Only add non-empty options
                select.appendChild(createOption(optionValue));
            }
        });

        return select;
    }

    function displayGallery() {
        const selectedCategory = document.getElementById('categorySelect').value;
        const subcategorySelect = document.getElementById('subcategorySelect');
        let selectedSubcategory = subcategorySelect.value;

        let filteredSubcategories = new Set();
        for (let i = 1; i < items.length; i++) {
            const item = items[i];
            if ((selectedCategory === 'All' || item[categoryIndex] === selectedCategory)) {
                const subcategory = item[subcategoryIndex] || ''; // Handle empty subcategory
                if (subcategory) {
                    filteredSubcategories.add(subcategory);
                }
            }
        }

        // Update subcategory dropdown
        subcategorySelect.innerHTML = ''; // Clear current options
        subcategorySelect.appendChild(createOption('All'));
        filteredSubcategories.forEach(subcategory => {
            subcategorySelect.appendChild(createOption(subcategory));
        });

        const gallery = document.getElementById('csvGallery');
        gallery.innerHTML = '';
        let itemCount = 0; // Initialize item count

        for (let i = 1; i < items.length; i++) {
            if ((selectedCategory === 'All' || items[i][categoryIndex] === selectedCategory) &&
                (selectedSubcategory === 'All' || items[i][subcategoryIndex] === selectedSubcategory)) {
                const div = createCard(items[i]);
                gallery.appendChild(div);
                itemCount++; // Increment count for each displayed item
            }
        }

        // Update the item count display
        document.getElementById('itemCount').textContent = ` ${itemCount} Found`;
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

    function createCard(dataRowItems) {
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
            } else if (['SKU', 'ID'].includes(headers[cellIndex])) {
                sku = createParagraph(cell, 'sku');
            } else if (cellIndex === 0) {
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

    // Live search function
    let timeout = null;

    function liveSearch() {
        clearTimeout(timeout);

        const input = document.getElementById("myInput");
        const filter = input.value.toUpperCase();
        const gallery = document.getElementById('csvGallery');
        const cards = gallery.getElementsByClassName('card');

        let itemCount = 0; // Reset item count for search results
        Array.from(cards).forEach(card => {
            const title = card.getElementsByClassName("title")[0];
            const sku = card.getElementsByClassName("sku")[0];
            const txtValueTitle = title ? title.textContent || title.innerText : '';
            const txtValueSku = sku ? sku.textContent || sku.innerText : '';

            if (txtValueTitle.toUpperCase().includes(filter) || txtValueSku.toUpperCase().includes(filter)) {
                card.style.display = "";
                itemCount++; // Increment count for displayed items
            } else {
                card.style.display = "none";
            }
        });

        // Update the item count display for search results
        document.getElementById('itemCount').textContent = ` ${itemCount} Found`;

        timeout = setTimeout(() => {
            input.value = '';
        }, 1500); // Clear input field 1.5 seconds after user stops typing
    }

    // Event listener for live search input
    document.getElementById("myInput").addEventListener('input', liveSearch);
});
