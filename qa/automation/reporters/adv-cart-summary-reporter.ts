import PairwiseSummaryReporter from './pairwise-summary-reporter';

export default class AdvCartSummaryReporter extends PairwiseSummaryReporter {
  protected group = 'ADV' as const;
  protected stem = 'adv-cart-summary';
}
