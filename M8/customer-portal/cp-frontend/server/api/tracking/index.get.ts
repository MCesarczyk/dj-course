import { TrackingData } from './TrackingData.model';
import { createScopedLogger } from '~/server/utils/logger';

const logger = createScopedLogger('API:tracking:list');

/**
 * List all tracking records (GeoJSON FeatureCollection documents).
 * Used by the dashboard's ActiveDeliveries component.
 */
export default defineEventHandler(async (event) => {
    try {
        const trackings = await TrackingData.find()
            .select('-__v -_id')
            .lean();

        logger.info(`Fetched ${trackings.length} tracking records`);
        return trackings;
    } catch (e) {
        logger.error('Failed to fetch tracking list', e as Error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to fetch tracking list from database',
        });
    }
});
