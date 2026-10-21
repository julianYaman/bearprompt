import type { DecisionSpec } from './types';

export const D1_ULTRA_SPECS: DecisionSpec[] = [
	{
		slug: 'noul-harmful-message',
		title: 'Ask if a message is harmful',
		description:
			'A Noul from Liquid’s usage examples: one probability you threshold in code.',
		packSlug: 'd1-ultra',
		authorSlug: 'liquid-ai',
		tags: ['noul', 'safety'],
		questions: [
			{
				name: 'is_harmful',
				type: 'noul',
				instructions: 'Does this user message contain harmful, threatening, or abusive content?'
			}
		],
		sampleState:
			"You're an absolute idiot and I hope your company goes bankrupt. I'm going to find out where you work.",
		sampleAnswers: {
			is_harmful: { type: 'noul', noul: 0.99 }
		},
		nextSteps:
			'If `is_harmful` is above 0.8, block. If it is below 0.2, allow. Otherwise send it to human review.'
	},
	{
		slug: 'choice-customer-intent',
		title: 'Classify a customer inquiry',
		description:
			'A Choice from Liquid’s usage examples: closed labels, a distribution, and a confidence value.',
		packSlug: 'd1-ultra',
		authorSlug: 'liquid-ai',
		tags: ['choice', 'support'],
		questions: [
			{
				name: 'intent',
				type: 'choice',
				instructions: 'What is the primary topic of this customer inquiry?',
				criteria: {
					billing: 'Questions about charges, invoices, refunds, or payment methods',
					technical: 'Bug reports, feature requests, or how-to questions about the product',
					shipping: 'Order status, delivery tracking, or shipping address changes',
					returns: 'Return requests, exchanges, or product condition issues',
					account: 'Login issues, profile updates, or subscription management'
				}
			}
		],
		sampleState:
			'Hi, I was charged twice for my subscription last month. The amounts are $29.99 on March 3rd and again on March 5th. Can you refund the duplicate charge?',
		sampleAnswers: {
			intent: {
				type: 'choice',
				choice: 'billing',
				probabilities: {
					billing: 0.9997,
					account: 0.0002,
					returns: 0.00005,
					shipping: 0.00003,
					technical: 0.00002
				},
				confidence: 0.9996
			}
		},
		nextSteps:
			'Map `intent` onto a queue (`billing-team`, `engineering-support`, `logistics`, `returns-desk`, `account-management`) and log the confidence.'
	},
	{
		slug: 'score-support-urgency',
		title: 'Score support urgency',
		description:
			'A Score from Liquid’s usage examples: a weighted position on a four-level rubric.',
		packSlug: 'd1-ultra',
		authorSlug: 'liquid-ai',
		tags: ['score', 'incident'],
		questions: [
			{
				name: 'urgency',
				type: 'score',
				instructions: 'How urgent is this support request?',
				criteria: [
					'Can wait: no immediate business impact, can be addressed in normal queue',
					'Should handle today: minor inconvenience or non-blocking issue',
					'Time-sensitive: noticeable customer impact, needs attention within hours',
					'Blocking revenue: critical system failure affecting customers or revenue'
				]
			}
		],
		sampleState:
			'Our production API is returning 500 errors on every request. All customers are affected. Revenue impact is approximately $12,000 per hour. Started 15 minutes ago.',
		sampleAnswers: {
			urgency: {
				type: 'score',
				score: 2.9995,
				probabilities: { '0': 0.00001, '1': 0.00002, '2': 0.0004, '3': 0.9996 },
				confidence: 0.9995
			}
		},
		nextSteps:
			'If `urgency` is 2.5 or higher, page on-call immediately. If it is 1.5 or higher, escalate to senior support. Otherwise add it to the standard queue.'
	},
	{
		slug: 'combine-ticket-triage',
		title: 'Combine noul, choice, and score',
		description:
			'Liquid’s combined usage example: classify, route, and prioritize one ticket in a single call.',
		packSlug: 'd1-ultra',
		authorSlug: 'liquid-ai',
		tags: ['combined', 'support'],
		questions: [
			{
				name: 'is_bug',
				type: 'noul',
				instructions:
					'Is the customer reporting a software bug (as opposed to a usage question, feature request, or account issue)?'
			},
			{
				name: 'team',
				type: 'choice',
				instructions: 'Which team should handle this ticket?',
				criteria: {
					billing: 'Billing, invoicing, charges, and payment method issues',
					engineering: 'Software bugs, crashes, and technical malfunctions',
					frontend: 'UI/UX issues, display problems, and browser-specific bugs',
					account: 'Account setup, permissions, plan changes, and access issues'
				}
			},
			{
				name: 'urgency',
				type: 'score',
				instructions:
					'How urgent is this ticket? Consider business impact, time sensitivity, and customer tier.',
				criteria: [
					'Low: no immediate impact, standard queue',
					'Medium: some business impact, handle within 24 hours',
					'High: significant business impact or time-sensitive, handle within 4 hours'
				]
			}
		],
		sampleState: {
			message:
				"The checkout page crashes with a white screen whenever I try to apply a promo code. I've tried three different browsers. This is blocking a $4,200 order for our team and we need to place it before our procurement window closes on Friday.",
			account: {
				plan: 'enterprise',
				arr: 52000,
				customer_since: '2022-03-15'
			}
		},
		sampleAnswers: {
			is_bug: { type: 'noul', noul: 0.9998 },
			team: {
				type: 'choice',
				choice: 'engineering',
				probabilities: {
					engineering: 0.8,
					frontend: 0.18,
					billing: 0.02,
					account: 0.0005
				},
				confidence: 0.74
			},
			urgency: {
				type: 'score',
				score: 1.996,
				probabilities: { '0': 0.0002, '1': 0.004, '2': 0.996 },
				confidence: 0.995
			}
		},
		nextSteps:
			'If `is_bug` is above 0.7 and `urgency` is above 1.5, escalate to that team’s on-call (4h SLA). If `urgency` is above 1.0, prioritize in that team’s queue (24h SLA). Otherwise use the standard backlog. If team confidence is below 0.5, note the runner-up.'
	}
];
