import { defineType, defineField } from 'sanity'

export const blogPostSchema = defineType({
  name: 'blogPost',
  title: 'Blog Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Título',
      type: 'string',
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      options: { source: 'title', maxLength: 80 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Data de publicação',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Resumo (meta description)',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required().max(160),
    }),
    defineField({
      name: 'primaryKeyword',
      title: 'Keyword primária (SEO)',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'segment',
      title: 'Segmento de público',
      type: 'string',
      options: {
        list: [
          { title: 'Geral', value: 'geral' },
          { title: 'MEI / Autônomo', value: 'mei' },
          { title: 'Contabilidade', value: 'contabilidade' },
          { title: 'Imobiliária', value: 'imobiliaria' },
          { title: 'Varejo / Atacado', value: 'varejo' },
          { title: 'Fintech / Banco', value: 'fintech' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'mainImage',
      title: 'Imagem principal',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Texto alternativo (SEO)',
          type: 'string',
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),
    defineField({
      name: 'body',
      title: 'Conteúdo',
      type: 'array',
      of: [
        { type: 'block' },
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            { name: 'alt', title: 'Alt text', type: 'string' },
            { name: 'caption', title: 'Legenda', type: 'string' },
          ],
        },
      ],
    }),
    defineField({
      name: 'estimatedReadingTime',
      title: 'Tempo de leitura (minutos)',
      type: 'number',
    }),
    defineField({
      name: 'hasCompetitorMentions',
      title: '⚠️ Menciona concorrentes?',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'complianceChecked',
      title: '✅ Compliance revisado (preços removidos, disclaimers incluídos)',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'lgpdDisclaimer',
      title: '✅ Disclaimer LGPD incluído',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'excerpt',
      media: 'mainImage',
    },
  },
})
