let items = [];
let headers;
let skuIndex;
let selectedItems = new Set();
let categoryIndex; // Declare categoryIndex in an outer scope
let subcategoryIndex; // Declare subcategoryIndex in an outer scope

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

        const categoryLabel = document.createElement('label');
        categoryLabel.textContent = 'Category:';
        categoryLabel.htmlFor = 'categorySelect';

        const subcategoryLabel = document.createElement('label');
        subcategoryLabel.textContent = 'Subcategory:';
        subcategoryLabel.htmlFor = 'subcategorySelect';

        galleryContainer.insertBefore(categoryLabel, galleryContainer.firstChild);
        galleryContainer.insertBefore(categorySelect, categoryLabel.nextSibling);
        galleryContainer.insertBefore(subcategoryLabel, categorySelect.nextSibling);
        galleryContainer.insertBefore(subcategorySelect, subcategoryLabel.nextSibling);

        displayGallery(items);
        document.getElementById('csvGallery').style.display = 'flex';
    })
    .catch(error => console.error('Error fetching CSV:', error));

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

    let filteredSubcategories = new Set();
    if (selectedCategory !== 'All') {
        for (let i = 1; i < items.length; i++) {
            if (items[i][categoryIndex] === selectedCategory) {
                filteredSubcategories.add(items[i][subcategoryIndex]);
            }
        }
    } else {
        filteredSubcategories = new Set(items.slice(1).map(item => item[subcategoryIndex]));
    }

    const subcategorySelect = document.getElementById('subcategorySelect');
    subcategorySelect.innerHTML = '';
    subcategorySelect.appendChild(createOption('All'));
    filteredSubcategories.forEach(subcategory => {
        subcategorySelect.appendChild(createOption(subcategory));
    });

    if (Array.from(filteredSubcategories).includes(selectedSubcategory)) {
        subcategorySelect.value = selectedSubcategory;
    } else {
        selectedSubcategory = 'All';
    }

    const gallery = document.getElementById('csvGallery');
    gallery.innerHTML = '';
    for (let i = 1; i < items.length; i++) {
        if ((selectedCategory === 'All' || items[i][categoryIndex] === selectedCategory) &&
            (selectedSubcategory === 'All' || items[i][subcategoryIndex] === selectedSubcategory)) {
            const div = createCard(items[i]);
            gallery.appendChild(div);
        }
    }
}

function createOption(value) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    return option;
}

const resetButton = document.createElement('button');
resetButton.textContent = 'Reset';
resetButton.style.display = 'block';
resetButton.addEventListener('click', function() {
    document.getElementById('categorySelect').value = 'All';
    document.getElementById('subcategorySelect').value = 'All';
    displayGallery();
});
galleryContainer.insertBefore(resetButton, galleryContainer.firstChild);

let timeout = null;

function liveSearch() {
    clearTimeout(timeout);

    const input = document.getElementById("myInput");
    const filter = input.value.toUpperCase();
    const gallery = document.getElementById('csvGallery');
    const cards = gallery.getElementsByClassName('card');

    for (let i = 0; i < cards.length; i++) {
        let title = cards[i].getElementsByClassName("title")[0];
        let sku = cards[i].getElementsByClassName("sku")[0];
        if (title || sku) {
            let txtValueTitle = title ? title.textContent || title.innerText : '';
            let txtValueSku = sku ? sku.textContent || sku.innerText : '';
            if (txtValueTitle.toUpperCase().indexOf(filter) > -1 || txtValueSku.toUpperCase().indexOf(filter) > -1) {
                cards[i].style.display = "";
            } else {
                cards[i].style.display = "none";
            }
        }       
    }

    timeout = setTimeout(function () {
        input.value = '';
    }, 1500);
}

function createContentDiv(dataRowItems) {
    const contentDiv = document.createElement('div');
    contentDiv.style.display = 'flex';
    contentDiv.style.flexDirection = 'column';
    let img, title, sku, quantity;
    dataRowItems.forEach((cell, cellIndex) => {
        if (items[0][cellIndex] === 'Title') {
            title = createParagraph(cell, cellIndex, dataRowItems);
            title.classList.add('title');
        } else if (['SKU', 'ID'].includes(items[0][cellIndex])) {
            sku = createParagraph(cell, cellIndex, dataRowItems);
            sku.classList.add('sku');
        } else if (items[0][cellIndex] === 'Quantity') {
            quantity = createParagraph(cell, cellIndex, dataRowItems);
            quantity.classList.add('quantity');
        } else if (cellIndex === 0) {
            img = createImage(cell);
        }
    });
    contentDiv.appendChild(img);
    contentDiv.appendChild(title);
    contentDiv.appendChild(quantity);
    contentDiv.appendChild(sku);
    return contentDiv;
}

function createCard(dataRowItems) {
    const div = document.createElement('div');
    div.classList.add('card');
    const itemKey = dataRowItems.join(',');

    if (selectedItems.has(itemKey)) {
        div.classList.add('selected');
    }

    // Modal functionality
    div.addEventListener('click', function() {
        const img = div.querySelector('img');
        const modal = document.getElementById("myModal");
        const modalImg = document.getElementById("img01");
        const captionText = document.getElementById("caption");
        
        modal.style.display = "block";
        modalImg.src = img.src;
        captionText.innerHTML = img.alt;

        // Add class to dim background
        document.body.classList.add('modal-open');
    });

    const contentDiv = createContentDiv(dataRowItems);
    div.appendChild(contentDiv);

    const quantityInput = document.createElement('input');
    quantityInput.type = 'number';
    quantityInput.min = '1';
    quantityInput.max = '99';
    quantityInput.value = '1';
    quantityInput.classList.add('quantity-input');
    quantityInput.style.display = 'none';
    quantityInput.style.position = 'absolute';
    quantityInput.style.top = '50%';
    quantityInput.style.left = '50%';
    quantityInput.style.transform = 'translate(-50%, -50%)';

    quantityInput.addEventListener('click', function(event) {
        event.stopPropagation();
    });

    div.appendChild(quantityInput);
    return div;
}

function createImage(cell) {
    const img = document.createElement('img');
    img.src = cell;
    img.alt = 'Thumbnail';
    img.classList.add('thumbnail');
    return img;
}

function createParagraph(cell, cellIndex, dataRowItems) {
    const p = document.createElement('p');
    const span = document.createElement('span');
    span.style.fontWeight = 'bold';

    if (items[0][cellIndex] === 'Title') {
        p.textContent = cell;
        p.classList.add('title');
    } else if (['SKU', 'ID'].includes(items[0][cellIndex])) {
        p.textContent = cell;
        p.classList.add('sku');
    } else if (items[0][cellIndex] === 'Quantity') {
        const quantityContainer = document.createElement('div');
        quantityContainer.classList.add('quantity-container');
        const quantity = document.createElement('p');
        quantity.textContent = cell;
        quantity.style.fontSize = '1.5em';
        quantity.classList.add('quantity');
        const availability = document.createElement('p');
        availability.textContent = 'Available';
        availability.classList.add('availability');
        quantityContainer.appendChild(quantity);
        quantityContainer.appendChild(availability);
        p.appendChild(quantityContainer);
    }
    return p;
}

document.addEventListener('DOMContentLoaded', (event) => {
    const modal = document.getElementById("myModal");
    const span = document.getElementsByClassName("close")[0];

    span.onclick = function() {
        modal.style.display = "none";
        document.body.classList.remove('modal-open'); // Remove class on close
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
            document.body.classList.remove('modal-open'); // Remove class on close
        }
    }
});

// Ensure your CSS includes these styles
const style = document.createElement('style');
style.textContent = `
    /* Modal styles */
    .modal {
        display: none;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.8);
    }

    .modal-content {
        margin: auto;
        display: block;
        max-width: 80%;
        max-height: 80%;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    .close {
        position: absolute;
        top: 20px;
        right: 30px;
        color: white;
        font-size: 40px;
        font-weight: bold;
        cursor: pointer;
    }

    .card {
        transition: opacity 0.3s;
    }

    .modal-open .card {
        opacity: 0.3;
    }
`;
document.head.appendChild(style);
