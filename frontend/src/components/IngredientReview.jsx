import { Check, Plus, Sparkles, X } from "lucide-react";
import { useState } from "react";

export function IngredientReview({ result, ingredients, onChange, onRestart, onConfirm }) {
  const [draft, setDraft] = useState("");
  function addIngredient(event) {
    event.preventDefault();
    const name = draft.trim().replace(/\s+/g, " ");
    if (!name || ingredients.some((item) => item.name.toLocaleLowerCase("bg") === name.toLocaleLowerCase("bg"))) return;
    onChange([...ingredients, { name, confidence: null, manual: true }]);
    setDraft("");
  }
  return <section className="ingredient-review" aria-labelledby="ingredients-title">
    <header className="review-heading">
      <div><p className="home-eyebrow"><Sparkles size={14} /> Провери предложението</p><h2 id="ingredients-title">Какво открихме</h2></div>
      <span className="ingredient-count">{ingredients.length} продукта</span>
    </header>
    <p className="review-copy">Разпознаването може да пропусне или обърка продукт. Премахни грешните и добави липсващите.</p>
    {result.warnings?.length > 0 && <div className="recognition-warning" role="note">{result.warnings.join(" ")}</div>}
    {ingredients.length > 0 ? <ul className="ingredient-list">
      {ingredients.map((ingredient, index) => <li key={`${ingredient.name}-${index}`}>
        <span className="ingredient-check"><Check size={15} /></span><span>{ingredient.name}</span>
        {ingredient.manual && <small>добавен</small>}
        <button onClick={() => onChange(ingredients.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Премахни ${ingredient.name}`}><X size={17} /></button>
      </li>)}
    </ul> : <div className="ingredient-empty"><p>Няма потвърдени продукти.</p><small>Добави ги ръчно или опитай с по-ясна снимка.</small></div>}
    <form className="ingredient-add" onSubmit={addIngredient}>
      <label htmlFor="new-ingredient">Липсващ продукт</label>
      <div><input id="new-ingredient" value={draft} maxLength={80} onChange={(event) => setDraft(event.target.value)} placeholder="Напр. червена чушка" /><button type="submit" disabled={!draft.trim()}><Plus size={18} /> Добави</button></div>
    </form>
    <footer className="review-actions"><button className="secondary-action" onClick={onRestart}>Друга снимка</button><button className="primary-button" onClick={onConfirm} disabled={!ingredients.length}>Потвърди продуктите</button></footer>
  </section>;
}
