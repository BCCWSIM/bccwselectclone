document.addEventListener('DOMContentLoaded', (event) => {
    // Modal initialization
    const modal = document.getElementById("myModal");
    const closeModalButton = modal.querySelector(".close");
    const modalImg = document.getElementById("img01");
    const captionText = document.getElementById("caption");

    // Function to close the modal
    function closeModal() {
        modal.style.display = "none";
        document.body.classList.remove('modal-open');
    }

    // Close the modal when the close button is clicked
    closeModalButton.onclick = closeModal;

    // Close the modal when clicking outside the modal content
    window.onclick = function(event) {
        if (event.target === modal) {
            closeModal();
        }
    };

    // Show the modal with an image and caption
    function showModal(imageSrc, caption) {
        modal.style.display = "block"; 
        modalImg.src = imageSrc;
        captionText.innerHTML = caption;
        document.body.classList.add('modal-open');
    }

    // Fetch CSV data
    let items = [];
    let headers, skuIndex, categoryIndex, subcategoryIndex;

    fetch('Resources.csv')
        .then(response => response.text())
        .then(csvData => {
            items = csvData.split('\n').filter(row => row.length > 0).map(row => row.split(','));
            headers = items[0];
            skuIndex = headers.indexOf('SKU');
            categoryIndex = headers.indexOf('Category');
            subcategoryIndex = headers.indexOf('Subcategory');

            const categories = new Set(items.slice(1).map(item => item[categoryIndex]));
            const subcategories = new Set(items.slice(1).map(item => item[subcategoryIndex]));

            const galleryContainer = document.getElementById('galleryContainer');
            const categorySelect = createDropdown('categorySelect', categories);
            const subcategorySelect = createDropdown('subcategorySelect', subcategories);

            categorySelect.addEventListener('change', displayGallery);
            subcategorySelect.addEventListener('change', displayGallery);

            // Insert the labels and dropdowns in the correct order
            galleryContainer.appendChild(createLabel('Category:', 'categorySelect'));
            galleryContainer.appendChild(categorySelect);
            galleryContainer.appendChild(createLabel('Subcategory:', 'subcategorySelect'));
            galleryContainer.appendChild(subcategorySelect);

            // Add reset button
            const resetButton = document.createElement('button');
            resetButton.textContent = 'Reset';
            resetButton.style.display = 'block';
            resetButton.addEventListener('click', function() {
                categorySelect.value = 'All';
                subcategorySelect.value = 'All';
                displayGallery(); // Refresh the gallery after reset
            });

            // Insert the reset button below the subcategory select
            galleryContainer.appendChild(resetButton);

            displayGallery(items); // Initially display all items
            document.getElementById('csvGallery').style.display = 'flex';
        })
        .catch(error => console.error('Error fetching CSV:', error));

    // Helper functions
    function createDropdown(id, options) {
        const select = document.createElement('select');
        select.id = id;

        const allOption = document.createElement('option');
        allOption.value = 'All';
        allOption.textContent = 'All';
        select.appendChild(allOption);

        options.forEach(optionValue => {
            const option = document.createElement('option');
            option.value = optionValue;
            option.textContent = optionValue;
            select.appendChild(option);
        });

        return select;
    }

    function displayGallery() {
        const selectedCategory = document.getElementById('categorySelect').value;
        const selectedSubcategory = document.getElementById('subcategorySelect').value;

        const gallery = document.getElementById('csvGallery');
        gallery.innerHTML = '';

        let itemCount = 0; // Initialize item count
        for (let i = 1; i < items.length; i++) {
            const item = items[i];
            const categoryMatch = selectedCategory === 'All' || item[categoryIndex] === selectedCategory;
            const subcategoryMatch = selectedSubcategory === 'All' || item[subcategoryIndex] === selectedSubcategory;

            if (categoryMatch && subcategoryMatch) {
                const card = createCard(item);
                gallery.appendChild(card);
                itemCount++; // Increment count for each displayed item
            }
        }

        // Update the item count display
        document.getElementById('itemCount').textContent = `${itemCount} Found`;
    }

    function createCard(dataRowItems) {
        const div = document.createElement('div');
        div.classList.add('card');

        div.addEventListener('click', function() {
            const img = div.querySelector('img');
            showModal(img.src, img.alt); // Show modal with image source and alt text
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
        for (let i = 0; i < cards.length; i++) {
            let title = cards[i].getElementsByClassName("title")[0];
            let sku = cards[i].getElementsByClassName("sku")[0];
            if (title || sku) {
                let txtValueTitle = title ? title.textContent || title.innerText : '';
                let txtValueSku = sku ? sku.textContent || sku.innerText : '';
                if (txtValueTitle.toUpperCase().indexOf(filter) > -1 || txtValueSku.toUpperCase().indexOf(filter) > -1) {
                    cards[i].style.display = "";
                    itemCount++; // Increment count for displayed items
                } else {
                    cards[i].style.display = "none";
                }
            }       
        }

        // Update the item count display for search results
        document.getElementById('itemCount').textContent = `${itemCount} Found`;

        timeout = setTimeout(function () {
            input.value = '';
        }, 1500); // Clear the input field 1.5 seconds after the user stops typing
    }

    // Event listener for live search input
    document.getElementById("myInput").addEventListener('input', liveSearch);
});
