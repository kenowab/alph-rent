import { useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { generateDescription } from '../../api/ai'
import Icon from '../ui/Icon'

export default function DescriptionGenerator({ form, onApply }) {
  const [loading, setLoading] = useState(false)
  const { language } = useLanguage()

  const labels = {
    en: 'Generate with AI',
    om: 'AI ti fayyadami',
    am: 'በ AI ይፍጠሩ',
  }

  const generatingLabels = {
    en: 'Generating...',
    om: 'Fakkii ta\'aa...',
    am: 'በማምረት ላይ...',
  }

  const successLabels = {
    en: 'Description generated! Review and edit as needed.',
    om: 'Ibsi fakkii ta\'e! Dorgommii fi too\'annii.',
    am: 'መግለጫ ተፈጥሯል! ይገምግሙ እና እንደ ስለত ያስተካክሉ።',
  }

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const { data } = await generateDescription({
        title: form.title,
        category: form.category,
        city: form.city,
        subArea: form.subArea,
        bedrooms: form.bedrooms,
        bathrooms: form.bathrooms,
        area: form.area,
        furnished: form.furnished,
        parking: form.parking,
        security: form.security,
        waterTank: form.waterTank,
        elevator: form.elevator,
        language,
      })
      if (data.description) {
        onApply(data.description)
      }
    } catch (err) {
      const errors = {
        en: 'Failed to generate description. Please try again.',
        om: 'Ibsi fakkii dhimma ta\'e. Maaloo deebi\'i yaadii.',
        am: 'መግለጫ ማመንጨት አልተሳካም። እባክዎን እንደገና ይሞክሩ።',
      }
      alert(errors[language] || errors.en)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleGenerate}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-primary-300 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 transition hover:bg-primary-100 disabled:opacity-50"
    >
      {loading ? (
        <>
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-300 border-t-primary-700" />
          {generatingLabels[language] || generatingLabels.en}
        </>
      ) : (
        <>
          <Icon name="sparkles" size={14} />
          {labels[language] || labels.en}
        </>
      )}
    </button>
  )
}
