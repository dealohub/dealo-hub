'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { PhotoUploader } from './PhotoUploader';
import { VideoUploader } from './VideoUploader';
import { saveDraft } from '@/lib/listings/actions';

interface Step2MediaClientProps {
  initialImageUrls: string[];
  initialVideoUrl: string | null;
  minPhotos: number;
  requireVideo: boolean;
}

export function Step2MediaClient({
  initialImageUrls,
  initialVideoUrl,
  minPhotos,
  requireVideo,
}: Step2MediaClientProps) {
  const t = useTranslations('sell.step.media');
  const router = useRouter();
  const [imageUrls, setImageUrls] = useState<string[]>(initialImageUrls);
  const [videoUrl, setVideoUrl] = useState<string | null>(initialVideoUrl);
  const [isPending, startTransition] = useTransition();

  const meetsImageMin = imageUrls.length >= minPhotos;
  const meetsVideo = !requireVideo || Boolean(videoUrl);
  const canContinue = meetsImageMin && meetsVideo;

  function continueNext() {
    startTransition(async () => {
      await saveDraft({
        image_urls: imageUrls,
        video_url: videoUrl,
        current_step: 'details',
      });
      router.push('/sell/details');
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <PhotoUploader
        urls={imageUrls}
        onChange={setImageUrls}
        minPhotos={minPhotos}
      />

      {requireVideo && <VideoUploader url={videoUrl} onChange={setVideoUrl} />}

      {!canContinue && imageUrls.length > 0 && (
        <FormMessage tone="help">
          {requireVideo
            ? t('requirementsLuxury', { min: minPhotos })
            : t('requirements', { min: minPhotos })}
        </FormMessage>
      )}

      <div className="flex items-center justify-end pt-2">
        <Button
          type="button"
          variant="primary"
          size="lg"
          disabled={!canContinue || isPending}
          onClick={continueNext}
        >
          <span>{isPending ? t('saving') : t('continue')}</span>
          <ArrowRight className="size-4 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}
