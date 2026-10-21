import type { DecisionSpec } from './types';

export const JEV_SPECS: DecisionSpec[] = [
	{
		slug: 'path-refund-policy',
		title: 'Point questions at fields in state',
		description:
			'TypeSafe’s structured-state example: two Nouls that name paths with backticks.',
		packSlug: 'jev',
		authorSlug: 'typesafe',
		tags: ['noul', 'policy'],
		questions: [
			{
				name: 'refund_requested',
				type: 'noul',
				instructions: 'Does `ticket.messages[0].text` request a refund?'
			},
			{
				name: 'policy_supports_refund',
				type: 'noul',
				instructions:
					'Does `refund_policy` support the refund requested in `ticket.messages[0].text`, given `order.charges`?'
			}
		],
		sampleState: {
			ticket: {
				subject: 'Duplicate charge',
				messages: [
					{
						from: 'customer',
						text: 'I was charged twice for order A-104. Please refund the duplicate.'
					},
					{ from: 'support', text: 'We are checking the charges.' }
				]
			},
			order: {
				id: 'A-104',
				charges: [
					{ amount_usd: 49, status: 'captured' },
					{ amount_usd: 49, status: 'captured' }
				]
			},
			refund_policy: 'Duplicate charges are eligible for a refund.'
		},
		sampleAnswers: {},
		nextSteps:
			'Name the part of state each question should judge with a dotted path in backticks.'
	},
	{
		slug: 'combine-flight-refund',
		title: 'Ask multiple questions together',
		description:
			'TypeSafe’s combined primitives example: noul, choice, and score against the same ticket.',
		packSlug: 'jev',
		authorSlug: 'typesafe',
		tags: ['combined', 'returns'],
		questions: [
			{
				name: 'refund_requested',
				type: 'noul',
				instructions: 'Does `ticket_message` request a refund?'
			},
			{
				name: 'request_type',
				type: 'choice',
				instructions: 'What is the main request in `ticket_message`?',
				criteria: {
					refund: 'The customer wants money returned.',
					rebooking: 'The customer wants a replacement flight.',
					information: 'The customer is asking for information only.'
				}
			},
			{
				name: 'frustration',
				type: 'score',
				instructions: 'How frustrated does the customer appear in `ticket_message`?',
				criteria: [
					'Calm and neutral.',
					'Concerned but civil.',
					'Very angry or using strong language.'
				]
			}
		],
		sampleState: {
			ticket_message: 'My flight was cancelled. Can I get a refund?',
			refund_policy: 'Cancelled flights are eligible for a full refund.'
		},
		sampleAnswers: {},
		nextSteps:
			'Send every question that uses the same state in one request. Print `refund_requested.noul`, `request_type.choice`, and `frustration.score`, then compose the decision in code.'
	},
	{
		slug: 'choice-shoe-returns',
		title: 'Route a shoe-store ticket',
		description:
			'TypeSafe’s Choice example: which department should handle a wrong-size order.',
		packSlug: 'jev',
		authorSlug: 'typesafe',
		tags: ['choice', 'returns'],
		questions: [
			{
				name: 'department',
				type: 'choice',
				instructions: 'Which team should handle this?',
				criteria: {
					returns: 'Exchanges, wrong or damaged items',
					shipping: 'Delivery status, delays, lost packages',
					billing: 'Charges, invoices, payment problems'
				}
			}
		],
		sampleState: 'My running shoes arrived in the wrong size. Can I swap them for a size 10?',
		sampleAnswers: {
			department: {
				type: 'choice',
				choice: 'returns',
				probabilities: {
					shipping: 0.0,
					returns: 1.0,
					billing: 0.0
				},
				confidence: 1.0
			}
		},
		nextSteps:
			'Read `department.choice`. This ticket puts all of the probability on `returns` at confidence 1.0. A ticket that mentions a wrong size and a missing refund would split probability between `returns` and `billing`.'
	},
	{
		slug: 'score-bug-severity',
		title: 'Score a Safari crash',
		description:
			'TypeSafe’s Score example: how severe a Safari-only export crash is on a three-level rubric.',
		packSlug: 'jev',
		authorSlug: 'typesafe',
		tags: ['score', 'incident'],
		questions: [
			{
				name: 'bug_severity',
				type: 'score',
				instructions: 'How severe is the reported issue?',
				criteria: [
					'Cosmetic; no impact to functionality',
					'Broken or degraded feature, but workaround exists',
					'Blocking issue; no workaround exists'
				]
			}
		],
		sampleState:
			'The export button crashes the settings page in Safari. It works in Chrome, but a few of our customers only use Safari.',
		sampleAnswers: {
			bug_severity: {
				type: 'score',
				score: 1.43,
				probabilities: { '0': 0.0, '1': 0.57, '2': 0.43 },
				confidence: 0.35
			}
		},
		nextSteps:
			'A score of 1.43 sits between “workaround exists” (0.57) and “no workaround” (0.43). Rank reports by score, or round to the nearest level when the code needs one outcome.'
	}
];
