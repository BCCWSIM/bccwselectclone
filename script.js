document.addEventListener('DOMContentLoaded', (event) => {
    // Modal initialization
    const modal = document.getElementById("myModal");
    const closeModalButton = modal.querySelector(".close");
    modal.style.display = "none";

    closeModalButton.onclick = closeModal;
    window.onclick = function(event) {
        if (event.target === modal) {
            closeModal();
        }
    };

    function closeModal() {
        modal.style.display = "none";
        document.body.classList.remove('modal-open');
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

            // Insert dropdowns in the correct order
            galleryContainer.appendChild(createLabel('Category:', 'categorySelect'));
            galleryContainer.appendChild(categorySelect);
            galleryContainer.appendChild(createLabel('Subcategory:', 'subcategorySelect'));
            galleryContainer.appendChild(subcategorySelect);

            // Add reset button
            const resetButton = document.createElement('button');
            resetButton.textContent = 'Reset';
            resetButton.style.display = 'block';
            resetButton.addEventListener('click', function() {
                document.getElementById('categorySelect').value = 'All';
                document.getElementById('subcategorySelect').value = 'All';
                displayGallery(); // Refresh the gallery
            });
            galleryContainer.appendChild(resetButton);

            displayGallery(items); // Initially display all items
            document.getElementById('csvGallery').style.display = 'flex';
        })
        .catch(error => console.error('Error fetching CSV:', error));

    // Create dropdown and other helper functions
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
        let selectedSubcategory = document.getElementById('subcategorySelect').value;

        const gallery = document.getElementById('csvGallery');
        gallery.innerHTML = ''; // Clear previous content

        // Filter and display items
        items.forEach(item => {
            if ((selectedCategory === 'All' || item[categoryIndex] === selectedCategory) &&
                (selectedSubcategory === 'All' || item[subcategoryIndex] === selectedSubcategory)) {
                const card = createCard(item);
                gallery.appendChild(card);
            }
        });
    }

    function createCard(dataRowItems) {
        const div = document.createElement('div');
        div.classList.add('card');

        div.addEventListener('click', function() {
            const img = div.querySelector('img');
            const modalImg = document.getElementById("img01");
            const captionText = document.getElementById("caption");

            modal.style.display = "block"; 
            modalImg.src = img.src;
            captionText.innerHTML = img.alt;

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

        dataRowItems.forEach((cell, cellIndex) => {
            if (cellIndex === 0) {
                const img = createImage(cell);
                contentDiv.appendChild(img);
            } else {
                const p = createParagraph(cell, headers[cellIndex]);
                contentDiv.appendChild(p);
            }
        });

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

    // Live search functionality
    document.getElementById("myInput").addEventListener('input', liveSearch);

    function liveSearch() {
        // Implement your live search logic here
    }
});
