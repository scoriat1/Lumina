import { useState } from 'react';
import { Box, Button, Card, Container, TextField, Typography } from '@mui/material';
import { Seo } from '../components/landing/Seo';
import { publicCenteredSectionSx } from '../components/landing/publicPageStyles';
import { colors } from '../theme';

export function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (field: keyof typeof formData) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) return;
    setSubmitted(true);
  };

  return (
    <>
      <Seo
        title="Contact | Lumina"
        description="Contact Lumina with questions about practice management software for session-based and client-based practices."
        path="/contact"
      />
      <Box component="section" sx={publicCenteredSectionSx}>
        <Container maxWidth="sm">
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography component="h1" sx={{ fontFamily: '"Crimson Pro", Georgia, serif', fontSize: { xs: '38px', sm: '48px' }, fontWeight: 700, lineHeight: 1.12, mb: 2 }}>
              {submitted ? 'Message sent' : 'Get in touch'}
            </Typography>
            <Typography sx={{ color: colors.text.secondary, fontSize: '16px' }}>
              {submitted ? "We'll get back to you soon." : "Have a question? We'd love to hear from you."}
            </Typography>
          </Box>
          {!submitted ? (
            <Card sx={{ p: { xs: 3, sm: 4.5 }, borderRadius: '14px', boxShadow: '0 8px 32px rgba(31, 28, 26, 0.08)', border: `1px solid ${colors.border.medium}` }}>
              <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField label="Name" value={formData.name} onChange={handleChange('name')} required fullWidth />
                <TextField label="Email" type="email" value={formData.email} onChange={handleChange('email')} required fullWidth />
                <TextField label="Message" value={formData.message} onChange={handleChange('message')} required fullWidth multiline rows={5} />
                <Button type="submit" variant="contained" sx={{ bgcolor: colors.brand.purple, textTransform: 'none', fontWeight: 700, py: 1.5, '&:hover': { bgcolor: colors.brand.purpleDark } }}>
                  Send message
                </Button>
              </Box>
            </Card>
          ) : null}
        </Container>
      </Box>
    </>
  );
}
