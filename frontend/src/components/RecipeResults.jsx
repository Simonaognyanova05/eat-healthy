import { ArrowLeft, Check, ChevronRight, Clock3, Flame, Star, Users } from "lucide-react";
import { useState } from "react";

function Rating({ value }) {
  return <span className="recipe-rating" aria-label={`${value} от 5 за използване на наличните продукти`}>{[1,2,3,4,5].map((star) => <Star key={star} size={14} fill={star <= value ? "currentColor" : "none"} />)}</span>;
}

const GOAL_LABELS = { lose: "отслабване", gain: "качване", maintain: "поддържане" };

export function RecipeResults({ recipes, personalization, onBack, onRestart }) {
  const [selected, setSelected] = useState(null);
  if (selected) return <RecipeDetail recipe={selected} onBack={() => setSelected(null)} />;
  return <section className="recipe-results" aria-labelledby="recipes-title">
    <header><div><p className="home-eyebrow">Създадени за твоята кухня{personalization?.goal && ` · цел: ${GOAL_LABELS[personalization.goal]}`}</p><h2 id="recipes-title">Три идеи за днес</h2><p>{personalization ? `Съобразени с дневен ориентир от ${personalization.dailyCalories} kcal и ${personalization.dailyProteinGrams} g протеин.` : "Избери рецепта, за да видиш продуктите и стъпките."}</p></div><button className="secondary-action" onClick={onBack}><ArrowLeft size={17} /> Към продуктите</button></header>
    <div className="recipe-grid">{recipes.map((recipe, index) => <article className="recipe-card" key={recipe.id}>
      <div className="recipe-number">0{index + 1}</div><Rating value={recipe.rating} /><h3>{recipe.title}</h3><p>{recipe.description}</p>
      <section className="meal-impact"><small>Ако изядеш една порция, ще приемеш приблизително</small><dl><div><dt>Калории</dt><dd>{recipe.nutrition.calories} <em>kcal</em></dd></div><div><dt>Протеин</dt><dd>{recipe.nutrition.proteinGrams} <em>g</em></dd></div><div><dt>Мазнини</dt><dd>{recipe.nutrition.fatGrams} <em>g</em></dd></div><div><dt>Въглехидрати</dt><dd>{recipe.nutrition.carbsGrams} <em>g</em></dd></div></dl></section>
      <small className="nutrition-note"><Clock3 size={13} /> {recipe.prepMinutes} мин · ориентировъчна AI оценка</small>
      <button className="recipe-open" onClick={() => setSelected(recipe)}>Виж рецептата <ChevronRight size={18} /></button>
    </article>)}</div>
    <button className="recipes-restart" onClick={onRestart}>Започни с нова снимка</button>
  </section>;
}

function RecipeDetail({ recipe, onBack }) {
  return <section className="recipe-detail" aria-labelledby="recipe-detail-title">
    <button className="detail-back" onClick={onBack}><ArrowLeft size={17} /> Всички рецепти</button>
    <header><Rating value={recipe.rating} /><h2 id="recipe-detail-title">{recipe.title}</h2><p>{recipe.description}</p><div className="detail-meta"><span><Clock3 size={16} /> {recipe.prepMinutes} мин</span><span><Users size={16} /> {recipe.servings} порции</span><span><Flame size={16} /> {recipe.nutrition.calories} kcal*</span></div></header>
    <div className="detail-columns"><section><h3>Необходими продукти</h3><ul className="detail-ingredients">{recipe.ingredients.map((item, index) => <li key={`${item.name}-${index}`}><span className="detail-ingredient-name">{item.available && <Check size={15} aria-hidden="true" />}{item.name}</span><strong>{item.quantity}</strong>{!item.available && <small>липсва</small>}</li>)}</ul></section><section><h3>Начин</h3><ol className="detail-steps">{recipe.steps.map((step, index) => <li key={index}><span>{index + 1}</span><div><strong>Стъпка {index + 1}</strong><p>{step}</p></div></li>)}</ol></section></div>
    <section className="nutrition-section" aria-labelledby="nutrition-title"><h3 id="nutrition-title">Хранителни стойности</h3><div className="nutrition-panel"><div><span>Калории</span><strong>{recipe.nutrition.calories}</strong><small>kcal</small></div><div><span>Белтъчини</span><strong>{recipe.nutrition.proteinGrams}</strong><small>g</small></div><div><span>Мазнини</span><strong>{recipe.nutrition.fatGrams}</strong><small>g</small></div><div><span>Въглехидрати</span><strong>{recipe.nutrition.carbsGrams}</strong><small>g</small></div></div></section>
    <p className="nutrition-disclaimer">* Стойностите са ориентировъчна AI оценка за една порция и не са проверени чрез хранителна база данни.</p>
  </section>;
}
