export interface StarterPromptDefinition {
	title: string;
	markdown: string;
	tags: string[];
}

export interface StarterPromptCategory {
	id: string;
	title: string;
	description: string;
	prompts: StarterPromptDefinition[];
}

export const STARTER_PROMPT_CATEGORIES: StarterPromptCategory[] = [
	{
		id: 'writing',
		title: 'Writing',
		description: 'Rewrite text, summarize, improve tone, generate outlines',
		prompts: [
			{
				title: 'Rewrite for clarity',
				markdown:
					'Rewrite the text below for clarity and flow. Keep the meaning intact, remove repetition, and make the language easier to understand.\n\nText:\n\n{{text:textarea}}',
				tags: ['Writing', 'Editing', 'Clarity']
			},
			{
				title: 'Adjust tone',
				markdown:
					'Rewrite the following text in a {{tone:select(friendly|professional|persuasive|concise)}} tone. Keep the core message, but adapt the wording to fit that voice.\n\nText:\n\n{{text:textarea}}',
				tags: ['Writing', 'Tone', 'Editing']
			},
			{
				title: 'Summarize key points',
				markdown:
					'Summarize the text below into concise bullet points. Highlight the most important ideas, decisions, and next steps.\n\nText:\n\n{{text:textarea}}',
				tags: ['Writing', 'Summary', 'Notes']
			},
			{
				title: 'Create an outline',
				markdown:
					'Create a clear outline for an article, memo, or document about the topic below. Include section headings and a short note on what each section should cover.\n\nTopic:\n\n{{topic}}',
				tags: ['Writing', 'Outline', 'Planning']
			},
			{
				title: 'Draft from rough notes',
				markdown:
					'Turn these rough notes into a polished draft. Fill in transitions, improve structure, and keep the final result readable and natural.\n\nNotes:\n\n{{notes:textarea}}',
				tags: ['Writing', 'Drafting', 'Editing']
			}
		]
	},
	{
		id: 'productivity',
		title: 'Productivity',
		description: 'Plan work, extract action items, prioritize tasks, structure meetings',
		prompts: [
			{
				title: 'Turn notes into action items',
				markdown:
					'Review the notes below and extract action items. For each action item, include an owner if obvious, a deadline if mentioned, and any blockers.\n\nNotes:\n\n{{notes:textarea}}',
				tags: ['Productivity', 'Tasks', 'Meetings']
			},
			{
				title: 'Prioritize my backlog',
				markdown:
					'Help me prioritize the following tasks. Group them into high, medium, and low priority, and explain the reasoning behind the ranking.\n\nTasks:\n\n{{tasks:textarea}}',
				tags: ['Productivity', 'Prioritization', 'Planning']
			},
			{
				title: 'Plan my week',
				markdown:
					'Create a focused weekly plan based on the tasks, meetings, and goals below. Balance deep work, admin work, and realistic capacity.\n\nContext:\n\n{{context:textarea}}',
				tags: ['Productivity', 'Planning', 'Weekly Review']
			},
			{
				title: 'Prepare a meeting agenda',
				markdown:
					'Create a concise meeting agenda from the context below. Include the objective, discussion points, decisions needed, and a suggested time allocation.\n\nContext:\n\n{{context:textarea}}',
				tags: ['Productivity', 'Meetings', 'Agenda']
			},
			{
				title: 'Write a follow-up',
				markdown:
					'Draft a short follow-up message after this meeting or conversation. Recap the main points, decisions, and next steps in a clear and professional way.\n\nContext:\n\n{{context:textarea}}',
				tags: ['Productivity', 'Communication', 'Follow Up']
			}
		]
	},
	{
		id: 'coding',
		title: 'Coding',
		description: 'Explain code, debug errors, refactor safely, generate test cases',
		prompts: [
			{
				title: 'Explain this code',
				markdown:
					'Explain what this code does in plain English. Call out the purpose, important logic, edge cases, and anything that might be surprising to a new contributor.\n\nCode:\n\n```{{language}}\n{{code:textarea}}\n```',
				tags: ['Coding', 'Code Review', 'Explanation']
			},
			{
				title: 'Debug an error',
				markdown:
					'Help me debug this issue. Based on the error message and code below, list the most likely causes, how to verify each one, and a recommended fix order.\n\nError:\n\n{{error:textarea}}\n\nCode:\n\n```{{language}}\n{{code:textarea}}\n```',
				tags: ['Coding', 'Debugging', 'Troubleshooting']
			},
			{
				title: 'Refactor safely',
				markdown:
					'Refactor the code below for readability and maintainability without changing behavior. Explain the main changes and any tradeoffs.\n\nCode:\n\n```{{language}}\n{{code:textarea}}\n```',
				tags: ['Coding', 'Refactoring', 'Maintainability']
			},
			{
				title: 'Generate test cases',
				markdown:
					'Generate a practical set of test cases for the function or feature below. Include happy paths, edge cases, invalid input, and regression risks.\n\nCode or feature description:\n\n{{details:textarea}}',
				tags: ['Coding', 'Testing', 'Quality']
			},
			{
				title: 'Review this pull request',
				markdown:
					'Review the change below like a senior engineer. Focus on bugs, regressions, missing tests, unclear naming, and maintainability concerns. Keep style comments secondary.\n\nChange summary or diff:\n\n{{details:textarea}}',
				tags: ['Coding', 'Review', 'Quality']
			}
		]
	},
	{
		id: 'marketing',
		title: 'Marketing',
		description: 'Write campaign ideas, messaging angles, social posts, positioning drafts',
		prompts: [
			{
				title: 'Create campaign angles',
				markdown:
					'Generate 5 distinct campaign angles for the product, feature, or launch below. For each angle, include the target audience, core message, and why it could resonate.\n\nContext:\n\n{{context:textarea}}',
				tags: ['Marketing', 'Campaigns', 'Positioning']
			},
			{
				title: 'Write social posts',
				markdown:
					'Write 5 social media post variations for the topic below. Make them concise, specific, and varied in style. Include a clear hook in each version.\n\nTopic:\n\n{{topic}}',
				tags: ['Marketing', 'Social Media', 'Copywriting']
			},
			{
				title: 'Improve product positioning',
				markdown:
					'Based on the notes below, draft a sharper positioning statement. Clarify who the product is for, the core problem it solves, and what makes it different.\n\nNotes:\n\n{{notes:textarea}}',
				tags: ['Marketing', 'Positioning', 'Messaging']
			},
			{
				title: 'Draft an email announcement',
				markdown:
					'Write a product or feature announcement email using the context below. Keep it concise, clear, and focused on user value.\n\nContext:\n\n{{context:textarea}}',
				tags: ['Marketing', 'Email', 'Launch']
			},
			{
				title: 'Summarize customer feedback themes',
				markdown:
					'Analyze the customer feedback below and summarize the key themes, top pains, requested features, and any positive signals.\n\nFeedback:\n\n{{feedback:textarea}}',
				tags: ['Marketing', 'Research', 'Customer Feedback']
			}
		]
	}
];
