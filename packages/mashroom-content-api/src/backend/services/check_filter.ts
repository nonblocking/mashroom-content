import type {MashroomContentApiFilter, FilterOperators, RootFilterOperators} from '../../../type-definitions';

const ALLOWED_OPS: Record<keyof RootFilterOperators<any> | keyof FilterOperators<any>, boolean> = {
    $and: true,
    $or: true,
    $eq: true,
    $ne: true,
    $gt: true,
    $gte: true,
    $lt: true,
    $lte: true,
    $in: true,
    $nin: true,
    $exists: true,
    $contains: true,
    $containsi: true,
    $notContains: true,
    $notContainsi: true,
};

export default (filter: MashroomContentApiFilter<any>): boolean => {
    const checkOps = (props: any): boolean => {
        if (!props) {
            return true;
        }
        return Object.keys(props).every((propKey) => {
            if (propKey.startsWith('$') && !(ALLOWED_OPS as any)[propKey]) {
                return false;
            }
            const prop = props[propKey];
            if (typeof (prop) === 'object') {
                return checkOps(prop);
            }
            return true;
        });
    }
    return checkOps(filter);
}
