import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { portfolioSummary, prompt } = await request.json();

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not configured');
      return NextResponse.json({ 
        error: 'OpenAI API key not configured',
        suggestions: [
          'Configure your OpenAI API key in the .env file to get AI-powered insights',
          'For now, using basic portfolio analysis recommendations'
        ]
      }, { status: 200 });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a professional financial advisor providing investment portfolio analysis. Provide 3-5 specific, actionable recommendations. Each recommendation should be 1-2 sentences and focus on practical improvements.'
        },
        {
          role: 'user',
          content: `${prompt}\n\nPortfolio Data: ${JSON.stringify(portfolioSummary, null, 2)}`
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('No response from OpenAI');
    }

    // Parse AI response into suggestions array
    const suggestions = aiResponse
      .split('\n')
      .filter(line => line.trim().length > 0)
      .filter(line => !line.match(/^\d+\.|^-\s*$/)) // Remove numbering and empty bullets
      .map(line => line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim())
      .filter(line => line.length > 10) // Filter out very short lines
      .slice(0, 5); // Limit to 5 suggestions

    return NextResponse.json({ 
      suggestions,
      provider: 'OpenAI GPT-3.5'
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Return fallback suggestions on error
    return NextResponse.json({
      error: 'AI analysis temporarily unavailable',
      suggestions: [
        'Consider diversifying across more asset classes and geographic regions to reduce risk',
        'Your portfolio shows high concentration in individual stocks - consider adding ETFs for broader exposure',
        'Adding bonds or defensive assets could help balance your portfolio risk profile',
        'International diversification through global ETFs could reduce regional concentration risk',
        'Regular rebalancing helps maintain your target asset allocation over time'
      ],
      provider: 'Fallback Analysis'
    });
  }
}