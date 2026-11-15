import React from 'react'
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  packageTitle?: string
  reference?: string
  accepted?: boolean
  checkIn?: string
  checkOut?: string
  total?: string
  reason?: string
}

const Email = ({ name, packageTitle, reference, accepted, checkIn, checkOut, total, reason }: Props) => (
  <Html lang="hy" dir="ltr">
    <Head />
    <Preview>{accepted ? 'Ձեր ամրագրումը հաստատվեց' : 'Ձեր ամրագրման հայտը մերժվեց'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>StayLand</Text>
        <Heading style={h1}>{accepted ? 'Ձեր ամրագրումը հաստատվեց 🎉' : 'Ձեր հայտը մերժվեց'}</Heading>
        <Text style={text}>{name ? `Բարև ${name},` : 'Բարև Ձեզ,'}</Text>
        <Text style={text}>
          {accepted
            ? `«${packageTitle ?? 'Փաթեթ'}» փաթեթի Ձեր ամրագրումը հաստատված է։`
            : `Ցավոք, «${packageTitle ?? 'Փաթեթ'}» փաթեթի Ձեր հայտը մերժվել է։`}
        </Text>
        {reference ? <Text style={muted}>Հայտի համար՝ {reference}</Text> : null}
        {checkIn && checkOut ? <Text style={muted}>Ամսաթվեր՝ {checkIn} – {checkOut}</Text> : null}
        {accepted && total ? <Text style={muted}>Ընդհանուր՝ {total}</Text> : null}
        {!accepted && reason ? <Text style={text}>Պատճառ՝ {reason}</Text> : null}
        <Button href="https://www.stayland.am/packages" style={button}>Բացել StayLand-ը</Button>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => (d['accepted'] ? 'Ձեր ամրագրումը հաստատվեց' : 'Ձեր ամրագրման հայտը մերժվեց') + (d['reference'] ? ` · ${d['reference']}` : ''),
  displayName: 'Փաթեթի ամրագրման պատասխան',
  previewData: { name: 'Անի', packageTitle: 'Ամանոր Դիլիջանում', reference: 'SL-1234', accepted: true, checkIn: '30.12.2026', checkOut: '02.01.2027', total: '250,000 AMD' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const brand = { fontSize: '18px', fontWeight: 700, color: '#1f4d3a', margin: '0 0 16px' }
const h1 = { fontSize: '22px', color: '#1a1a1a', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#333333', lineHeight: '1.5' }
const muted = { fontSize: '14px', color: '#666666', margin: '4px 0' }
const button = { backgroundColor: '#1f4d3a', color: '#ffffff', padding: '12px 20px', borderRadius: '8px', fontSize: '14px', marginTop: '16px' }
