export type GraphicId =
  | 'waveformBars'
  | 'gridBlocks'
  | 'noiseLines'
  | 'fluidGrid'
  | 'interfaceBlueprint'

export type StackCardData = {
  title: string
  bg: string
  fg: string
  labelColor: string
  textColor: string
  descColor: string
  graphic: GraphicId
  seed: number
  desc: string
}

export const STACK_CARDS: StackCardData[] = [
  {
    title: 'Working\nKnowledge',
    bg: '#E54F10',
    fg: '#FFFFC2',
    labelColor: '#FFFFC2',
    textColor: '#FFFFC2',
    descColor: 'rgba(255, 255, 194, 0.7)',
    graphic: 'waveformBars',
    seed: 12345,
    desc: "Frameworks, principles, and models I've learned and developed that you will be able to immediately apply to your practice.",
  },
  {
    title: 'Practical\nDemonstration',
    bg: '#F6EBD9',
    fg: '#524733',
    labelColor: '#524733',
    textColor: '#524733',
    descColor: 'rgba(82, 71, 51, 0.8)',
    graphic: 'gridBlocks',
    seed: 54321,
    desc: 'Detailed walkthroughs of designing interfaces, identifying opportunities, and improving through refinement.',
  },
  {
    title: 'Collaborate\nwith AI',
    bg: '#0A90D2',
    fg: '#AEFFFF',
    labelColor: '#AEFFFF',
    textColor: '#AEFFFF',
    descColor: 'rgba(174, 255, 255, 0.8)',
    graphic: 'noiseLines',
    seed: 11111,
    desc: 'Video lessons on practical, specific methods of working with AI to get exacting results. Tools covered include Claude Code and v0.',
  },
  {
    title: 'Means &\nMethods',
    bg: '#53F399',
    fg: '#004D00',
    labelColor: '#004D00',
    textColor: '#004D00',
    descColor: 'rgba(0, 77, 0, 0.7)',
    graphic: 'fluidGrid',
    seed: 22222,
    desc: 'General tips and techniques to apply to your daily work to achieve excellence in interface design and assembly.',
  },
  {
    title: 'Interface Kit',
    bg: '#211F1E',
    fg: '#F6EBD9',
    labelColor: '#F6EBD9',
    textColor: '#F6EBD9',
    descColor: 'rgba(246, 235, 217, 0.7)',
    graphic: 'interfaceBlueprint',
    seed: 33333,
    desc: 'Screencasts, highlights, and deep dives that showcase the end-to-end journey for designing and building Interface Kit. Members get early betas and free lifetime access to the tool.',
  },
]
