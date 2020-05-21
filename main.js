
//state values
let recipesInfo = {}; // {recipeid: recipe object, ...}, 
//initialized to the recipe objects returned from https://spoonacular.com/food-api/docs#Get-Recipe-Information
const recipesInstructions = {}; //{recipeid: recipe instructions object, ...},
//initialized to the recipe instruction objects returned from https://spoonacular.com/food-api/docs#Get-Analyzed-Recipe-Instructions
let sortedIds = []; //sorted recipeids based on what sorting type user chooses
let sortStyle = null;
const apiKey = `8a8b1fccd36243c69b171320b12aec27`; //unique to my account, needed for API
let fetchedSearchData = {}; // initialized to the results object returned from https://spoonacular.com/food-api/docs#Search-Recipes
const filter = {"cuisine": [], "diet": []}; //used to store what filters user chooses
let ingrAdjustRatio = 1; //ratio used to adjust ingredients quamtities
let currentRecipeId = null; //recipeid of recipe user opens
const numResults = 5; //number of results that will show up on search
{/* <article class="recipe-result hidden">
    <section class="result-description">
        <h2 class="title"></h2>
        <section class="stats result">
            <div class="left">
                <section class="likes">
                    <span class="material-icons">favorite</span>
                    <span class="num-likes"></span>
                </section>
                <section class="health-score">
                    <span class="material-icons">local_hospital</span>
                    <span class="health-score-num"></span>
                </section>
            </div>
            <div class="right">
                <section class="servings-description">
                    <span class="material-icons">local_dining</span>
                    <span class="servings-num"></span>
                </section>
                <section class="cook-time">
                    <span class="material-icons">schedule</span>
                    <span class="cook-time-num"></span>
                </section>
            </div>
        </section>
    </section>
    <img src="images/chickenParm.webp" alt="recipe pic">
</article> */}

/**
 * Callback function for when user clicks on search
 * 
 * Mutates recipesInfo, recipeInstructions by adding all the info for the search results, 
 */
async function getInfoForSearchResults() {
  if (fetchedSearchData) {
    for(recipe of fetchedSearchData.results) {
      const recipeInfo = fetch(`https://api.spoonacular.com/recipes/${recipe.id}/information?includeNutrition=false&apiKey=${apiKey}`);
      recipesInfo[recipe.id] = await recipeInfo.then(response => response.json()).then(result => result);
      console.log(recipesInfo);
      const recipeInstruction = fetch(`https://api.spoonacular.com/recipes/${recipe.id}/analyzedInstructions?apiKey=${apiKey}`);
      console.log(recipeInstruction);
      recipesInstructions[recipe.id] = (await recipeInstruction.then(response => response.json()).then(result => result))[0];

      // recipesInfo[recipe.id] = ingredientsData[recipe.id];
      // recipesInstructions[recipe.id] = recipeData[recipe.id][0];
      console.log(recipe);
    };
  }
  handleSortSelection();
}


/**
 * Initializes the results page with result elements for all found recipes, in order of sortedIds
 */
function updateSearchResults() {
    closeRecipe();
    const results = document.querySelector(`.search-results`);
    results.innerHTML = "";

    sortedIds.forEach(id => {
      const resultElem = makeSearchResultElement(id);
      results.append(resultElem);
    });

    console.log(recipesInfo);
    console.log(recipesInstructions);
    console.log(sortedIds);

}

/**
 * Shows a recipe's details
 * @param {recipeid} id 
 */
function showRecipe(id) {
    currentRecipeId = id;
    console.log(`showing recipe`);
    document.querySelector(`.search-container`).classList.add(`hidden`);
    document.querySelector(`.recipe-container`).classList.remove(`hidden`);
    loadDescription(id);
    loadIngredients(id);
    loadIngrAdjust(id);
    loadSteps(id);
}

/**
 * Closes a recipe's details (opens results page)
 */
function closeRecipe() {
    document.querySelector(`.search-container`).classList.remove(`hidden`);
    document.querySelector(`.recipe-container`).classList.add(`hidden`);
    document.querySelector(`.directions-list`).innerHTML = "";
    document.querySelector(`.unit input`).value = "";
    document.querySelector(`.unit span`).textContent = "";
    console.log(`adjusting adjust ratio to 1`);
    ingrAdjustRatio = 1;
    currentRecipeId = null;
}

/**
 * Helper function used to make result elements
 * @param {recipeid for recipe} id 
 * @returns HTMLElement for recipe result
 */
function makeSearchResultElement(id) {
    const template = document.querySelector(`.recipe-result.hidden`);
    const resultElem = template.cloneNode(true);
    resultElem.classList.remove(`hidden`);
    resultElem.setAttribute(`data-id`, id);
    const healthScore = recipesInfo[id].healthScore;
    const servings = recipesInfo[id].servings;
    const likes = recipesInfo[id].aggregateLikes;
    const cookTime = recipesInfo[id].readyInMinutes;
    resultElem.querySelector(`img`).setAttribute(`src`, recipesInfo[id].image);
    resultElem.querySelector(`.title`).innerHTML = recipesInfo[id].title;
    resultElem.querySelector(`.num-likes`).textContent = likes;
    resultElem.querySelector(`.health-score-num`).textContent = `score ${healthScore}`;
    resultElem.querySelector(`.cook-time-num`).textContent = `${cookTime} mins`;
    resultElem.querySelector(`.servings-num`).textContent = `serves ${servings}`;
    resultElem.addEventListener(`click`, () => showRecipe(id));
    return resultElem;
}

/**
 * Callback for when user clicks on ingredient
 * Mutates the ingredient element to be checked or unchecked
 */
function handleIngredientClick() {
  console.log(this);
  this.classList.toggle(`checked`);
  this.querySelector(`input`).checked = !this.querySelector(`input`).checked;
}

/**
 * Used with handleIngredientClick to prevent event propagation
 */
function handleCheckClick() {
  this.checked = !this.checked;
}

{/* <li class="ingredient hidden">
    <div>
        <input type="checkbox">
        <p class="type"></p>
    </div>
    <div class="quantity">
        <span class="quantity-num"></span>
        <span class="quantity-unit"></span>
    </div>
</li> */}

/**
 * Callback for when user uses the adjust ingredient drop down
 * Mutates the UI by bolding the refresh element
 */
function handleAdjustUnit() {
  console.log(this);
  const chosenIngrElem = Array.from(this.querySelectorAll(`option`)).find(ingr => ingr.selected == true);
  console.log(chosenIngrElem);
  document.querySelector(`.unit span`).textContent = chosenIngrElem.dataset.unit;
  document.querySelector(`.apply`).classList.add(`notify`);
}

/**
 * Callback for when the user clicks the refresh button
 * Mutates the UI by adjusting the ingredients quantity as specified by ingrAdjustRatio
 */
function handleAdjustRefresh() {
  const chosenAdjustAmount = document.querySelector(`.unit input`).value;
  document.querySelector(`.apply`).classList.remove(`notify`);
  if (chosenAdjustAmount != ``) {
    const adjustSelect = document.querySelector(`select[name=chosen-ingredient]`);
    const chosenIngrElem = Array.from(adjustSelect.querySelectorAll(`option`)).find(ingr => ingr.selected == true);
    console.log(chosenIngrElem);
    console.log(chosenAdjustAmount);
    if (chosenIngrElem.value == `None`) {
      ingrAdjustRatio = 1;
      document.querySelector(`.unit input`).value = "";
      loadIngredients(currentRecipeId);
    } else {
      try {
        ingrAdjustRatio = parseFloat(chosenAdjustAmount) / chosenIngrElem.dataset.amount;
        console.log(ingrAdjustRatio);
        loadIngredients(currentRecipeId);
      } catch (err) {
        console.log(err);
      }
    }
  }
}

/**
 * Helper function used to load ingredients for specific recipe
 * @param {recipeid} id 
 */
function loadIngredients(id) {
    const ingreList = document.querySelector(`.ingredients-list`);
    ingreList.innerHTML = ``;

    recipesInfo[id].extendedIngredients.forEach(ingredient => {
        const ingrTemplate = document.querySelector(`.ingredient.hidden`);
        const ingrElement = ingrTemplate.cloneNode(true);
        ingrElement.classList.remove(`hidden`);
        const amount = ingredient.amount;
        const unit = ingredient.unit;
        const name = ingredient.name;
        ingrElement.querySelector(`.type`).textContent = name;
        ingrElement.querySelector(`.quantity-num`).textContent = Math.floor(parseFloat(amount)*ingrAdjustRatio*1000)/1000;
        ingrElement.querySelector(`.quantity-unit`).textContent = unit;
        ingrElement.querySelector(`input`).addEventListener(`click`, handleCheckClick);
        ingrElement.addEventListener(`click`, handleIngredientClick);
        ingreList.append(ingrElement);
        });
}

/**
 * Helper function used to load ingredient adjust bar for specific recipe
 * @param {recipeid} id 
 */
function loadIngrAdjust(id) {
  const adjustSelect = document.querySelector(`select[name=chosen-ingredient]`);
  adjustSelect.innerHTML = "";
  const noneElement = document.createElement(`option`);
  noneElement.setAttribute(`value`, `None`);
  noneElement.textContent = `None`;
  adjustSelect.append(noneElement);
  adjustSelect.addEventListener(`change`, handleAdjustUnit);
  const ingrAdjust = document.querySelector(`.ingredient-adjust`);
  const template = ingrAdjust.querySelector(`span.apply`);
  const newRefresh = template.cloneNode(true);
  newRefresh.classList.remove(`notify`);
  const rightSideElements = document.querySelector(`.inputs .right`);
  rightSideElements.removeChild(template);
  rightSideElements.append(newRefresh);
  newRefresh.addEventListener(`click`, handleAdjustRefresh);
  recipesInfo[id].extendedIngredients.forEach(ingredient => {
    if (ingredient.unit) {
      const optionElement = document.createElement(`option`);
      optionElement.setAttribute(`value`, ingredient.name);
      optionElement.textContent = ingredient.name;
      optionElement.setAttribute(`data-unit`, ingredient.unit);
      optionElement.setAttribute(`data-amount`, ingredient.amount);
      adjustSelect.append(optionElement);
    }
  });
}


{/* <div class="description-container">
<h1 class="title">Chicken Parm</h1>
<p class="author">Person</p>
<section class="stats">
    <div class="left">
        <section class="likes">
            <span class="material-icons">favorite</span>
            <span class="num-likes">12</span>
        </section>
        <section class="health-score">
            <span class="material-icons">local-hospital</span>
            <span class="health-score-num">score 19</span>
        </section>
    </div>
    <div class="right">
        <section class="servings-description">
            <span class="material-icons">local_dining</span>
            <span class="servings-num">serves 2</span>
        </section>
        <section class="cook-time">
            <span class="material-icons">schedule</span>
            <span class="cook-time-num">23 min</span>
        </section>
    </div>
</section>
</div> */}

/**
 * Helper function used to load decription for a specific recipe
 * @param {recipeid} id 
 */
function loadDescription(id) {
    const healthScore = recipesInfo[id].healthScore;
    const servings = recipesInfo[id].servings;
    const likes = recipesInfo[id].aggregateLikes;
    const cookTime = recipesInfo[id].readyInMinutes;
    const author = recipesInfo[id].creditsText;
    const descriptionElem = document.querySelector(`.description-container`);
    document.querySelector(`.description img`).setAttribute(`src`, recipesInfo[id].image);
    document.querySelector(`.title`).innerHTML = recipesInfo[id].title;
    descriptionElem.querySelector(`.author`).textContent = author;
    descriptionElem.querySelector(`.num-likes`).textContent = likes;
    descriptionElem.querySelector(`.health-score-num`).textContent = `score ${healthScore}`;
    descriptionElem.querySelector(`.cook-time-num`).textContent = `${cookTime} mins`;
    descriptionElem.querySelector(`.servings-num`).textContent = `serves ${servings}`;
}


{/* <li class="step-container hidden">
    <div class="step-num"></div>
    <div>
        <!-- <input type="checkbox"> -->
        <h3 class="step"></h3>
        <p class="step-description">
        </p>
    </div>
</li> */}

/**
 * Helper function used to load steps for specific recipe
 * @param {recipeid} id 
 */
function loadSteps(id) {
    const directionsList = document.querySelector(`.directions-list`);
    console.log(recipesInstructions[id]);
    if (recipesInstructions[id]) {
        recipesInstructions[id].steps.forEach(currStep => {
          const stepNumber = currStep.number;
          const stepDescription = currStep.step.split(" ");
          const template = document.querySelector(`.step-container.hidden`);
          const stepElem = template.cloneNode(true);
          stepElem.classList.remove(`hidden`);
          stepElem.querySelector(`.step-num`).textContent = stepNumber;
          stepElem.querySelector(`.step`).textContent = stepDescription.splice(0, 1).join(` `);
          stepElem.querySelector(`.step-description`).textContent = stepDescription.splice(1).join(` `);
          directionsList.appendChild(stepElem);
      });
    }
}

/**
 * Mutates sortedIds based on what the user selected from sort type dropdown
 */
function handleSortSelection() {
  console.log(`handling sort`);
  const selectedSort = Array.from(document.querySelectorAll(`.sort-by select option`)).find(option => option.selected == true);
  console.log(selectedSort);
  sortStyle = selectedSort.value;
  sortedIds = Object.keys(recipesInfo).sort((a, b) => {
    switch(sortStyle) {
      case `popularity`: {
        return (recipesInfo[a].aggregateLikes > recipesInfo[b].aggregateLikes) ? -1 : 1;
      }
      case `healthiness` : {
        return (recipesInfo[a].healthScore > recipesInfo[b].healthScore) ? -1 : 1;
      }
      case `servings` : {
        return (recipesInfo[a].servings > recipesInfo[b].servings) ? -1 : 1;
      }
      case `time` : {
        return (recipesInfo[a].readyInMinutes > recipesInfo[b].readyInMinutes) ? -1 : 1;
      }
    }
  });
  console.log(sortedIds);
}

/**
 * Callback for when user clicks on reverses order of results
 */
function handleSortToggle() {
  sortedIds.reverse();
}

/**
 * Toggles between ingredients and directions
 * @param {HTMLElement label for chosen option} label 
 */
function handleViewChange(label) {
  console.log(label);
  if (label.classList.contains(`chosen`)) return
  const inputElem = label.querySelector(`input`);
  console.log(inputElem.value);
  label.classList.add(`chosen`);
  switch(inputElem.value) {
    case `ingredients`: {
      document.querySelector(`.directions-toggle`).classList.remove(`chosen`);
      document.querySelector(`.directions`).classList.add(`hidden`);
      document.querySelector(`.ingredients`).classList.remove(`hidden`);
      break;
    }
    case `directions`: {
      document.querySelector(`.ingredients-toggle`).classList.remove(`chosen`);
      document.querySelector(`.ingredients`).classList.add(`hidden`);
      document.querySelector(`.directions`).classList.remove(`hidden`);
      break;
    }
  }
}

/**
 * Callback for when user clicks on search,
 * 
 * Mutates fetchedSearchData by populating it with numResults recipe results
 */
async function handleSearchInput() {
  const searchInput = document.querySelector(`.search-input input`).value;
  console.log(searchInput);
  const searchResults = fetch(`https://api.spoonacular.com/recipes/search?query=${searchInput}&
  instructionsRequired=true&number=${numResults}&sort=${sortStyle}&apiKey=${apiKey}`);
  fetchedSearchData = await searchResults.then(response => response.json()).then(result => result);
  recipesInfo = {};
  console.log(fetchedSearchData);
}

function handleFilterInput() {
  console.log(`not implemented`);
}

/**
 * Mutates UI by bolding the refresh button
 */
function notifyAdjustToUser() {
  document.querySelector(`.apply`).classList.add(`notify`);
}

/**
 * Main function used to initialize event listeners for recipe input, sorting style selection, 
 * back button
 */
function main() {
  //getInfoForSearchResults();
  document.querySelector(`.recipe-input`).addEventListener(`click`, async () => {
    await handleSearchInput();
    await getInfoForSearchResults();
    updateSearchResults();
  });
  document.querySelector(`.sort-by select`).addEventListener(`change`, () => { 
    handleSortSelection();
    updateSearchResults();
  });
  document.querySelector(`button.back`).addEventListener(`click`, () => updateSearchResults());
  document.querySelector(`.sort-by select`).dispatchEvent(new Event('change'));
  document.querySelector(`.toggle-sort`).addEventListener(`click`, () => {
    handleSortToggle();
    updateSearchResults();
  });
  document.querySelectorAll(`.choice label`).forEach(label => label.addEventListener(`click`, function(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    handleViewChange(label)
  }));
  document.querySelector(`.filter`).addEventListener(`click`, handleFilterInput);
  document.querySelector(`.unit input`).addEventListener(`change`, notifyAdjustToUser);
}

main();


{/* <section class="description">
    <img src="images/chickenParm.webp" alt="picture of recipe">
</section>
<div class="description-container">
    <h1 class="title">Chicken Parm</h1> 
    <p class="author">Person</p>
*/}




