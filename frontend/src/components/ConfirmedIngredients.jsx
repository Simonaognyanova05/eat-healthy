import { CheckCircle2, LoaderCircle, Pencil, Sparkles } from "lucide-react";

export function ConfirmedIngredients({ ingredients, onEdit, onGenerate, generating, error }) {
  return <section className="confirmed-ingredients" aria-labelledby="confirmed-title" aria-live="polite">
    <span className="confirmed-icon"><CheckCircle2 size={34} /></span>
    <p className="home-eyebrow">Списъкът е готов</p>
    <h2 id="confirmed-title">Продуктите са<br />потвърдени</h2>
    <p>Запазихме избора ти за тази сесия. Следващата стъпка е да създадем рецепти с тези продукти.</p>
    <div className="confirmed-summary"><strong>{ingredients.length}</strong><span>{ingredients.length === 1 ? "потвърден продукт" : "потвърдени продукта"}</span></div>
    <ul aria-label="Потвърдени продукти">{ingredients.map((ingredient, index) => <li key={`${ingredient.name}-${index}`}>{ingredient.name}</li>)}</ul>
    <div className="confirmed-actions">
      <button className="secondary-action" onClick={onEdit}><Pencil size={17} /> Редактирай списъка</button>
      <button className="primary-button" onClick={onGenerate} disabled={generating}>{generating ? <><LoaderCircle className="spin" size={17} /> Създаваме рецепти…</> : <><Sparkles size={17} /> Генерирай</>}</button>
    </div>
    {error && <div className="recipe-generation-error" role="alert"><p>{error}</p><button onClick={onGenerate}>Опитай отново</button></div>}
  </section>;
}
